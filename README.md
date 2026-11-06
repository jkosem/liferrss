# LifeRSS

A small, keyboard-first Firefox RSS/Atom reader. **M1 is a development preview.**

## Try M1 in Firefox

1. Download or clone the `feature/m1-reader` branch.
2. Open Firefox at `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and select `manifest.json`.
4. Open the sidebar using Firefox's sidebar selector and choose LifeRSS.
5. Click **+** and paste a direct RSS or Atom feed URL.

Temporary add-ons are removed when Firefox restarts. We can package and sign the extension later.

## M1 features

- Sidebar with Unread and All article lists, feed filtering and search
- RSS 2.0 and Atom parsing; refresh every 30 minutes while Firefox runs
- Locally stored subscriptions, article summaries and read/unread states
- Keyboard: `j/k` navigate and open; `n/p` select; `m` toggle read; `v` original tab; `a` add feed; `r` refresh; `/` filter; `?` help
- No remote backend or account

## Later milestones

- M2: quiet toolbar-based feed discovery, Firefox bookmarks as Read Later, OPML import/export
- M3: Dropbox sync for subscriptions, read states and settings, **not** bookmarks or article cache
- M4: refinements and configurable Inoreader-compatible keyboard shortcuts

No recommendations, social/sharing features, tags, offline article downloads, or separate bookmark sync.

## Implementation notes

This initial preview uses plain JavaScript and browser extension APIs with no build step. RSS article summaries are displayed as plain text instead of injecting feed HTML. The manifest requests `<all_urls>` for arbitrary user-supplied feed URLs; narrower optional host permissions should be considered before release.

M1 has not yet been tested in a running Firefox instance. Treat it as a testable implementation draft rather than a published release.
