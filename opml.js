/* OPML is data only. Never render imported markup. */
const Opml = {
  parse(xml) {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.querySelector("parsererror") || doc.documentElement.localName !== "opml" ||
        !doc.querySelector("body")) throw new Error("Choose a valid OPML file");
    let skipped = 0, failed = 0;
    const entries = [], seen = new Set();
    for (const outline of doc.querySelectorAll("outline")) {
      const raw = outline.getAttribute("xmlUrl");
      // Category outlines have no feed URL; malformed feed outlines do.
      if (raw === null && !/^(rss|atom)$/i.test(outline.getAttribute("type") || "")) continue;
      try {
        if (!raw?.trim()) throw new Error("Missing feed URL");
        const url = FeedUtils.normalizeUrl(raw.trim());
        if (seen.has(url)) { skipped++; continue; }
        seen.add(url);
        entries.push({url, title: outline.getAttribute("title") || outline.getAttribute("text") || url});
      } catch { failed++; }
    }
    return {entries, skipped, failed};
  },
  export(feeds) {
    const doc = document.implementation.createDocument("", "opml");
    const root = doc.documentElement;
    root.setAttribute("version", "2.0");
    const head = doc.createElement("head"), title = doc.createElement("title");
    title.textContent = "LiferRSS subscriptions"; head.append(title); root.append(head);
    const body = doc.createElement("body"); root.append(body);
    for (const feed of feeds) {
      const outline = doc.createElement("outline");
      outline.setAttribute("type", "rss");
      outline.setAttribute("text", feed.title || feed.url);
      outline.setAttribute("title", feed.title || feed.url);
      outline.setAttribute("xmlUrl", feed.url);
      body.append(outline);
    }
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(doc);
  }
};
