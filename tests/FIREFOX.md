# Firefox verification

Automated tests use Chromium's DOM/XML with mocked extension APIs. They do not
replace the following checks in Firefox 115 or newer.

## OPML

- Load the v0.1.1 add-on, add RSS and Atom feeds, open an article (auto-mark read),
  toggle another article's read state, and record subscription URLs and counts.
- Reload the new code under the same Gecko ID. Confirm subscriptions, article
  summaries and read states survive. Check search, feed filtering, Unread/All,
  j/k, n/p, m, v, a, r, /, ?, Escape, and the 30-minute refresh alarm.
- Tab to Export OPML, press Enter, and confirm a download with correct titles
  and URLs. Import into a fresh profile and confirm all feeds are added.
- Re-import the same file: no duplicates. Import a nested file containing
  duplicates, malformed URLs, failed requests and valid RSS/Atom feeds: verify
  added/skipped/failed counts, and that valid feeds after failures still import.
- Import malformed XML: existing subscriptions/cache/read state stay intact.
- Start two subscriptions/imports during a refresh: no lost subscriptions.
- Use only the keyboard to import a file and export subscriptions.

Manual status: pending; no Firefox binary is installed in the implementation
environment. Record Firefox results before merging the feature PR.

## Toolbar discovery

- Invoke the toolbar on a page declaring one RSS link: confirm before subscribing.
- Test multiple RSS/Atom alternates, repeated relative/absolute URLs, fragments,
  mixed-case MIME/rel values, and a base URL; each distinct HTTP(S) feed appears once.
- Confirm an existing subscription (including an old URL with a fragment) is
  labelled Already subscribed. Confirm subscribing uses the sidebar feed store.
- A page with no alternates shows a quiet popup message. Internal Firefox pages
  show an unavailable message. Page contents remain unchanged.
- Tab through multiple feeds and subscribe with Enter. Test a failed feed and retry.
- Confirm permissions prompt, unchanged legacy subscriptions/cache/read states,
  and no page inspection until the toolbar is invoked.

## Read Later

- Open an article, press s: exactly one bookmark appears in Other Bookmarks →
  LiferRSS Read Later. Press s again: it is removed. Repeat with the button
  and with Tab/Enter; aria-pressed and button text reflect the saved state.
- Save the same URL from two reader windows: only one bookmark is created.
- Delete/edit/move a saved bookmark in Firefox: the visible reader updates.
  Bookmarks outside the dedicated folder do not count as Read Later.
- Move the folder: existing saves are recognized. Delete it: reader updates
  without recreating it. Save again: one folder/bookmark is recreated.
- Articles without an HTTP(S) link have a disabled save button.
- Switch articles rapidly while bookmark lookups are pending: the save button
  belongs to the current article. Check a rejected API call reports an error.
- Verify existing subscriptions/cache/read state and Gecko ID survive reload;
  extension storage contains no copied bookmark records.
