/* LiferRSS: background RSS/Atom fetcher. No remote backend. */
const DEFAULTS = { feeds: [], articles: [], states: {} };
const POLL_MINUTES = 30;
const MAX_PER_FEED = 200;

async function load() {
  return browser.storage.local.get(DEFAULTS);
}
function cleanText(value) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function nodeText(parent, name) {
  const element = parent.getElementsByTagName(name)[0];
  return element?.textContent?.trim() || "";
}
function itemLink(item, atom) {
  if (!atom) return nodeText(item, "link");
  const links = [...item.getElementsByTagName("link")];
  return links.find(link => !link.getAttribute("rel") || link.getAttribute("rel") === "alternate")?.getAttribute("href") || "";
}
function parseFeed(xml, url) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Invalid XML feed");
  const atom = !!doc.getElementsByTagName("feed")[0] && !doc.getElementsByTagName("channel")[0];
  const root = atom ? doc.getElementsByTagName("feed")[0] : doc.getElementsByTagName("channel")[0];
  if (!root) throw new Error("Not an RSS or Atom feed");
  const title = nodeText(root, "title") || url;
  const nodes = [...root.getElementsByTagName(atom ? "entry" : "item")].slice(0, MAX_PER_FEED);
  const articles = nodes.map(node => {
    let link = itemLink(node, atom);
    try { link = new URL(link, url).href; } catch { link = ""; }
    const guid = atom ? nodeText(node, "id") : nodeText(node, "guid");
    const key = guid || link || nodeText(node, "title");
    const date = nodeText(node, "pubDate") || nodeText(node, "published") || nodeText(node, "updated");
    const description = nodeText(node, "description") || nodeText(node, "summary") || nodeText(node, "content");
    return {
      id: url + "|" + key, feedUrl: url, title: nodeText(node, "title") || "(untitled)",
      link, published: Number.isFinite(Date.parse(date)) ? Date.parse(date) : Date.now(),
      summary: cleanText(description).slice(0, 1200)
    };
  });
  return { title, articles };
}
async function refreshFeed(url) {
  const store = await load();
  const existing = store.feeds.find(f => f.url === url);
  if (!existing) return;
  try {
    const response = await fetch(url, { cache: "no-cache", credentials: "omit", redirect: "follow", signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const raw = await response.text();
    if (raw.length > 5_000_000) throw new Error("Feed response too large");
    const parsed = parseFeed(raw, url);
    // Reload before writing so changing read states aren't overwritten by a slow request.
    const latest = await load();
    if (!latest.feeds.some(f => f.url === url)) return;
    const previous = new Map(latest.articles.map(a => [a.id, a]));
    for (const article of parsed.articles) previous.set(article.id, article);
    const articles = [...previous.values()].sort((a, b) => b.published - a.published).slice(0, 5000);
    const feeds = latest.feeds.map(f => f.url === url ? {...f, title: parsed.title, error: "", refreshedAt: Date.now()} : f);
    await browser.storage.local.set({ feeds, articles });
  } catch (error) {
    const latest = await load();
    await browser.storage.local.set({feeds:latest.feeds.map(f => f.url === url ? {...f,error:String(error.message || error)} : f)});
    throw error;
  }
}
async function refreshAll() {
  const {feeds} = await load();
  for (const feed of feeds) {
    try { await refreshFeed(feed.url); } catch (error) { console.warn("LiferRSS feed error", feed.url, error); }
  }
}
// Serialize subscription/cache writes, including alarm refreshes, so imports and
// toolbar subscriptions cannot overwrite each other. Read states stay separate.
let pending = Promise.resolve();
function enqueue(task) {
  const result = pending.then(task);
  pending = result.catch(() => {});
  return result;
}
async function addFeed(value) {
  const url = FeedUtils.normalizeUrl(value);
  const store = await load();
  const existing = store.feeds.find(f => FeedUtils.sameUrl(f.url, url));
  if (existing) return {ok:true, added:false};
  // Validate before persisting a new subscription. A failed import leaves no
  // placeholder subscription and does not touch the existing article cache.
  const response = await fetch(url, {cache:"no-cache", credentials:"omit", redirect:"follow", signal:AbortSignal.timeout(30000)});
  if (!response.ok) throw new Error("HTTP " + response.status);
  const raw = await response.text();
  if (raw.length > 5_000_000) throw new Error("Feed response too large");
  const parsed = parseFeed(raw, url);
  const latest = await load();
  const articles = [...latest.articles, ...parsed.articles]
    .sort((a,b) => b.published-a.published);
  await browser.storage.local.set({
    feeds:[...latest.feeds,{url,title:parsed.title,error:"",refreshedAt:Date.now()}],
    articles
  });
  return {ok:true, added:true};
}
async function handleMessage(message) {
  if (message?.type === "getReadLater") return {saved:await ReadLater.has(message.url)};
  if (message?.type === "setReadLater") return ReadLater.set(message.url, message.title, message.saved === true);
  if (message?.type === "addFeed") return addFeed(message.url);
  if (message?.type === "exportOpml") return {xml:Opml.export((await load()).feeds)};
  if (message?.type === "importOpml") {
    if (typeof message.xml !== "string" || message.xml.length > 5_000_000) {
      throw new Error("Choose an OPML file smaller than 5 MB");
    }
    const parsed = Opml.parse(message.xml);
    const result = {added:0, skipped:parsed.skipped, failed:parsed.failed};
    for (const entry of parsed.entries) {
      try {
        const subscription = await addFeed(entry.url);
        result[subscription.added ? "added" : "skipped"]++;
      } catch { result.failed++; }
    }
    return result;
  }
  if (message?.type === "refresh") { await refreshAll(); return {ok:true}; }
  if (message?.type === "removeFeed") {
    const data = await load();
    await browser.storage.local.set({
      feeds:data.feeds.filter(f=>f.url!==message.url),
      articles:data.articles.filter(a=>a.feedUrl!==message.url)
    });
    return {ok:true};
  }
}
browser.runtime.onMessage.addListener(message => enqueue(() => handleMessage(message)));
browser.runtime.onInstalled.addListener(() => {
  browser.alarms.create("refresh", {periodInMinutes:POLL_MINUTES});
});
browser.runtime.onStartup.addListener(() => {
  browser.alarms.create("refresh", {periodInMinutes:POLL_MINUTES});
  enqueue(refreshAll);
});
browser.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "refresh") enqueue(refreshAll);
});
browser.alarms.create("refresh",{periodInMinutes:POLL_MINUTES});
