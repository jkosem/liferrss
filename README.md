# LifeRSS

A small, keyboard-first Firefox RSS/Atom reader. **v0.1 is a development preview.**

## Try v0.1 in Firefox

1. Download or clone the `v0.1-core-reader` branch.
2. Open Firefox at `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and select `manifest.json`.
4. Open the sidebar using Firefox's sidebar selector and choose LifeRSS.
5. Click **+** and paste a direct RSS or Atom feed URL.

Temporary add-ons are removed when Firefox restarts. We can package and sign the extension later.

## v0.1 — Core reader

- Sidebar with Unread and All article lists, feed filtering and search
- RSS 2.0 and Atom parsing; refresh every 30 minutes while Firefox runs
- Locally stored subscriptions, article summaries and read/unread states
- Keyboard: `j/k` navigate and open; `n/p` select; `m` toggle read; `v` original tab; `a` add feed; `r` refresh; `/` filter; `?` help
- No remote backend or account

## Version roadmap

- **v0.2:** Quiet toolbar-based feed discovery, Firefox bookmarks as Read Later, OPML import/export
- **v0.3:** Dropbox sync for subscriptions, read states and settings, **not** bookmarks or article cache
- **v1.0:** Refined interface, configurable Inoreader-compatible keyboard shortcuts and stable release

No recommendations, sharing, tags, offline article downloads, or separate bookmark sync.

## Implementation notes

This initial preview uses plain JavaScript and browser extension APIs with no build step. RSS article summaries are displayed as plain text instead of injecting feed HTML. The manifest requests `<all_urls>` for arbitrary user-supplied feed URLs; narrower optional host permissions should be considered before release.

v0.1 has not yet been tested in a running Firefox instance. Treat it as a testable implementation draft rather than a published release.
