/* Executed only by an explicit toolbar invocation. Read the page, never mutate it. */
function scanPageFeeds() {
  return [...document.querySelectorAll("link[href]")].map(link => ({
    rel:link.getAttribute("rel") || "",
    type:link.getAttribute("type") || "",
    title:link.getAttribute("title") || "",
    href:link.getAttribute("href"),
    base:document.baseURI
  }));
}
const Discovery = {
  collect(links) {
    const seen = new Set(), feeds = [];
    for (const link of links) {
      if (!link.rel.toLowerCase().split(/\s+/).includes("alternate") ||
          !["application/rss+xml","application/atom+xml"].includes(link.type.split(";")[0].trim().toLowerCase())) continue;
      try {
        const url = FeedUtils.normalizeUrl(link.href, link.base);
        if (seen.has(url)) continue;
        seen.add(url);feeds.push({url,title:link.title.trim() || url});
      } catch { /* Invalid or non-HTTP(S) alternates are not subscriptions. */ }
    }
    return feeds;
  }
};
