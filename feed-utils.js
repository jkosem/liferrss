/* Shared URL identity; never rewrite stored URLs or article IDs. */
const FeedUtils = {
  normalizeUrl(value, base) {
    const url = new URL(value, base);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) {
      throw new Error("Use an HTTP(S) feed URL without credentials");
    }
    url.hash = "";
    return url.href;
  },
  sameUrl(a, b) {
    try { return this.normalizeUrl(a) === this.normalizeUrl(b); }
    catch { return a === b; }
  }
};
