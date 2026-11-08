# LiferRSS development plan

## Product principles

LiferRSS is a small, keyboard-first Firefox RSS/Atom reader. It should remain local-first, quiet and understandable. New features should preserve the plain JavaScript implementation and avoid introducing a runtime build step unless a later milestone demonstrates a clear need.

The following remain out of scope: recommendations, sharing, tags, offline article downloads and a separate bookmark-sync system.

## Current state: v0.1.1

The v0.1 core reader has been manually tested in Firefox and merged. v0.1.1 applies the final LiferRSS name and aligns release documentation without changing reader behavior.

Before tagging v0.1.1:

- Confirm the manifest version is `0.1.1`.
- Load `manifest.json` as a temporary Firefox add-on.
- Confirm the sidebar opens as LiferRSS.
- Add and refresh an RSS or Atom feed.
- Confirm article navigation, reading, filtering and read/unread state still work.
- Merge the release-hygiene pull request, then tag the merge commit `v0.1.1`.

Do not move the existing `v0.1.0` tag if it may already have been shared or downloaded.

## v0.2 goal

Make subscriptions easier to discover and move between readers, and add a Read Later action that relies on Firefox bookmarks rather than a second synchronization system.

Deliver v0.2 as three focused feature pull requests, followed by one integration and release pass.

## 1. OPML import and export

Implement this first because it is self-contained and gives users a backup and migration path before the subscription workflow grows.

### Behavior

- Export all subscriptions as a valid OPML file containing feed title and feed URL.
- Import RSS and Atom subscriptions from an OPML file.
- Normalize and deduplicate feed URLs against both existing subscriptions and duplicates within the file.
- Continue importing valid entries when another entry is malformed or cannot be fetched.
- Present a concise result summary: added, skipped and failed.
- Keep existing subscriptions and article state intact.

### Acceptance criteria

- Exported OPML can be imported into a fresh LiferRSS profile.
- Re-importing the same file creates no duplicate subscriptions.
- A mixed valid/invalid file imports the valid entries and reports the rest.
- Import and export are accessible without a mouse.

## 2. Quiet toolbar feed discovery

Implement discovery only after the OPML data path is stable.

### Behavior

- Add a Firefox toolbar action that checks the active page when explicitly invoked.
- Detect standard RSS and Atom alternate links declared by the page.
- If one feed is found, show a clear subscribe confirmation.
- If several feeds are found, show a compact picker.
- If no feed is found, report that quietly without modifying the page.
- Reuse the existing subscription and refresh path instead of creating a second feed store.

### Acceptance criteria

- A page declaring one RSS feed can be subscribed to from the toolbar.
- A page declaring multiple feeds presents each distinct option once.
- A page with no declared feed produces a non-disruptive result.
- Already subscribed feeds are identified and are not duplicated.
- Discovery does not inject visible controls into ordinary web pages.

## 3. Firefox bookmarks as Read Later

Implement Read Later after discovery so bookmark-specific UI and permissions stay isolated in their own review.

### Behavior

- Store saved article URLs in a dedicated `LiferRSS Read Later` Firefox bookmark folder.
- Create the folder on first use if it does not exist.
- Allow the current article to be saved or removed from Read Later from the reader view.
- Reflect bookmark changes made outside LiferRSS.
- Treat Firefox bookmarks as the source of truth; do not copy bookmark records into extension storage.
- If the folder is deleted, recreate it only when the user next saves an article.

### Acceptance criteria

- Saving an article creates one bookmark in the dedicated folder.
- Saving the same article twice creates no duplicate bookmark.
- Removing the bookmark updates the reader state.
- Deleting and recreating the folder does not damage subscriptions or read state.
- The action works by keyboard as well as by pointer.

## 4. v0.2 integration and release

After the three feature pull requests merge:

- Add visible feed removal or management; the background message already supports removal, but v0.1 has no sidebar control for it.
- Review whether `<all_urls>` can be replaced or reduced without making arbitrary feed subscriptions impractical.
- Run manifest validation or Firefox extension linting.
- Test install or upgrade from v0.1.1 with existing subscriptions and states.
- Test RSS, Atom, malformed XML, duplicate OPML entries, toolbar discovery and external bookmark changes.
- Update the README and manifest version.
- Package the extension for persistent testing before starting Dropbox sync.

## Verification approach

Each feature pull request should include:

- Focused parser or data-helper tests using representative fixtures where practical.
- A manual Firefox checklist covering the changed interaction.
- Confirmation that existing subscriptions, article cache and read states survive the change.
- Documentation updates for new permissions and user-visible controls.

The extension runtime should remain build-free. Development-only validation tools are acceptable when they provide repeatable checks and do not become runtime dependencies.

## Later milestones

### v0.3

Add Dropbox synchronization for subscriptions, read states and settings. Do not synchronize Firefox bookmarks or the article cache. Define a versioned storage schema and conflict behavior before implementation.

### v1.0

Refine the interface, add configurable Inoreader-compatible keyboard shortcuts, complete permissions and privacy review, and prepare a stable signed release.
