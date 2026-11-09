# LiferRSS project memory

Last updated: 2026-11-09.

## Purpose and sources
Small, keyboard-first, local-first Firefox RSS/Atom reader.
Repository: https://github.com/jkosem/liferrss
Read README.md for usage and PLAN.md for milestone scope and acceptance criteria. AGENTS.md describes how Codex should work here.

## Confirmed baseline
Inspected main at commit 9cfe605.
- Manifest version: 0.1.1; Firefox minimum: 115.0; Manifest V3.
- Plain JavaScript extension, no runtime build step, package manifest or automated test suite.
- Background scripts handle RSS/Atom parsing, subscriptions and 30-minute refresh.
- Sidebar provides reading, filtering and keyboard navigation.
- browser.storage.local holds feeds, articles and states.
- README reports the v0.1 core was manually tested in Firefox. This setup session did not independently repeat that test.
- Release-hygiene PR #3 is merged. The existence of a v0.1.1 release tag has not been checked.

## Agreed product direction
Preserve the existing local-first, quiet design and keyboard access.
v0.2 delivery order: OPML import/export; quiet toolbar feed discovery; Firefox bookmarks as Read Later; integration and release.
v0.3: Dropbox synchronization for subscriptions, read states and settings only.
v1.0: interface refinement, configurable Inoreader-compatible shortcuts and stable release.
Detailed behavior and exclusions live in PLAN.md.

## Cloud context and persistence
The existing repository was cloned and inspected in a managed cloud workspace.
AGENTS.md and this file are being proposed for persistent Codex context; they must be available on the branch used by a future session.
Creating these files does not configure a reusable Codex cloud environment or enable ChatGPT project memory. No reusable cloud configuration has been published in this session.
No application behavior or extension permissions were changed for this setup.

## Next steps
Review and merge the Codex setup pull request.
Select jkosem/liferrss in the Codex cloud environment used for future tasks.
For the next feature task, begin with OPML import/export unless the user changes priorities.
