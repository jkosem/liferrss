async function discover() {
  const status = document.getElementById("discoveryStatus");
  try {
    const [tab] = await browser.tabs.query({active:true,currentWindow:true});
    if (!tab?.id || !/^https?:\/\//i.test(tab.url || "")) {
      status.textContent = "Feed discovery is available on ordinary web pages.";
      return;
    }
    const results = await browser.scripting.executeScript({target:{tabId:tab.id},func:scanPageFeeds});
    const feeds = Discovery.collect(results[0]?.result || []);
    status.textContent = feeds.length === 0 ? "No RSS or Atom feeds declared on this page." :
      feeds.length === 1 ? "Subscribe to this feed?" : "Choose a feed to subscribe to.";
    const {feeds:subscriptions} = await browser.storage.local.get({feeds:[]});
    for (const feed of feeds) {
      const row = document.createElement("article"), title = document.createElement("h2");
      title.textContent = feed.title;
      const url = document.createElement("small");url.textContent = feed.url;
      const button = document.createElement("button");
      const subscribed = subscriptions.some(f=>FeedUtils.sameUrl(f.url,feed.url));
      button.textContent = subscribed ? "Already subscribed" : "Subscribe";
      button.disabled = subscribed;
      button.onclick = async () => {
        button.disabled = true;status.textContent = "Subscribing…";
        try {
          const result = await browser.runtime.sendMessage({type:"addFeed",url:feed.url});
          button.textContent = "Already subscribed";
          status.textContent = result.added ? "Subscribed. Open the LiferRSS sidebar to read." : "Already subscribed.";
        } catch(error) {
          status.textContent = "Unable to subscribe: " + error.message;
          button.disabled = false;
        }
      };
      row.append(title,url,button);document.getElementById("discoveredFeeds").append(row);
    }
  } catch {
    status.textContent = "Firefox cannot inspect this page. Try another web page.";
  }
}
discover();
