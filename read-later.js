/* Firefox bookmarks are the only source of truth. No persisted bookmark cache. */
const ReadLater = {
  folderTitle:"LiferRSS Read Later",
  articleUrl(value) {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) throw new Error("This article has no HTTP(S) URL");
    return url.href;
  },
  async folders() {
    return (await browser.bookmarks.search({title:this.folderTitle}))
      .filter(node=>!node.url && node.title===this.folderTitle);
  },
  async matches(url) {
    const folders = await this.folders(), matches = [];
    for (const folder of folders) {
      try {
        const children = await browser.bookmarks.getChildren(folder.id);
        matches.push(...children.filter(node=>node.url===url));
      } catch {
        // A folder can be removed outside LiferRSS between search and lookup.
        // If it still exists, propagate the real API error.
        if ((await this.folders()).some(node=>node.id===folder.id)) throw new Error("Cannot read Read Later bookmarks");
      }
    }
    return matches;
  },
  async has(value) {
    return (await this.matches(this.articleUrl(value))).length>0;
  },
  async set(value, title, saved) {
    const url=this.articleUrl(value), matches=await this.matches(url);
    if (!saved) {
      for (const bookmark of matches) {
        try { await browser.bookmarks.remove(bookmark.id); }
        catch { if (await this.has(url)) throw new Error("Cannot remove Read Later bookmark"); }
      }
      return {saved:await this.has(url)};
    }
    if (!matches.length) {
      const folders=await this.folders();
      const folder=folders[0] || await browser.bookmarks.create({
        parentId:"unfiled_____",title:this.folderTitle
      });
      await browser.bookmarks.create({parentId:folder.id,url,title:title || url});
    }
    return {saved:await this.has(url)};
  }
};
