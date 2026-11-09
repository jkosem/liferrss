# LiferRSS

A small, keyboard-first Firefox RSS/Atom reader. The v0.1 core reader has been manually tested in Firefox and merged.

## Try v0.1.1 in Firefox

1. Download the latest release, or clone the `main` branch.
2. Open Firefox at `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and select `manifest.json`.
4. Open the sidebar using Firefox's sidebar selector and choose LiferRSS.
5. Click **+** and paste a direct RSS or Atom feed URL.

Temporary add-ons are removed when Firefox restarts. We can package and sign the extension later.

## Release status

- **v0.1.0:** Initial core reader release, before the final LiferRSS product name was applied.
- **v0.1.1:** Final LiferRSS branding and release documentation; no functional changes from the tested core reader.

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

See [PLAN.md](PLAN.md) for the v0.2 scope, delivery order and acceptance criteria.

No recommendations, sharing, tags, offline article downloads, or separate bookmark sync.

## Implementation notes

The extension uses plain JavaScript and browser extension APIs with no runtime build step. RSS article summaries are displayed as plain text instead of injecting feed HTML. The manifest requests `<all_urls>` for arbitrary user-supplied feed URLs; narrower optional host permissions should be considered before a stable release.

v0.1 was manually tested in a running Firefox instance before being marked complete. Future feature PRs should include their own manual Firefox test checklist.

## v0.2 feature: OPML

Use **Import OPML** or **Export OPML** in the sidebar (Tab to either button,
then Enter). Export saves all subscriptions, including titles, as an OPML file.
Import accepts nested RSS/Atom outlines, skips normalized duplicate HTTP(S)
URLs, continues after individual failures and reports added/skipped/failed.
Files are limited to 5 MB; individual feed requests time out after 30 seconds.
Invalid XML rejects the file without modifying subscriptions. Failed new feeds
are not retained. URL fragments are ignored for duplicate matching; existing
stored URLs and article IDs are preserved. No new permissions are required.

Development verification: run `node tests/run.cjs` with Playwright available
and Chromium at `/usr/bin/chromium` (or set `CHROMIUM_PATH`). These are
development-only dependencies; the extension remains build-free.
See [tests/FIREFOX.md](tests/FIREFOX.md) for manual Firefox checks.

If browser launch is restricted, `TEST_DOM=adapter node tests/run.cjs` runs the
same data tests using the development-only `xml-js` SAX parser and a minimal
DOM adapter. It does not verify native browser XML or extension integration.

## v0.2 feature: quiet feed discovery

Invoke the **Find feeds with LiferRSS** toolbar button on a web page. Confirm
the single feed or choose a Subscribe button in the list. Existing subscriptions
are labelled and disabled. Pages without declared RSS/Atom alternates show a
quiet message in the popup. Firefox internal/protected pages cannot be inspected.
Discovery reads the active page only on invocation and never adds page controls.

New permissions: `activeTab` grants access on invocation; `scripting` reads
declared alternate links in the active page. There are no persistent content
scripts, tab-change listeners or automatic page scans. Existing feed host access
is unchanged pending the integration permissions review.
