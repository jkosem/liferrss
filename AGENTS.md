# Codex instructions for LiferRSS

## Start each session
Read README.md, PLAN.md and MEMORY.md before making changes. Inspect the current branch, working tree and relevant source; verify memory against the checkout. Follow the user's current request when it changes earlier plans.

## Project
LiferRSS is a small, keyboard-first, local-first Firefox RSS/Atom extension. Use plain JavaScript, HTML, CSS and browser extension APIs. There is no runtime build step or remote backend.

- manifest.json: Firefox MV3 manifest and permissions.
- background.js: subscriptions, RSS/Atom parsing, refresh and storage messages.
- sidebar.js / sidebar.html / sidebar.css: reader interaction and presentation.
- PLAN.md: milestone scope, delivery order and acceptance criteria.

Preserve subscriptions, article cache and read states. Render feed content as plain text. Explain new permissions. Keep keyboard access working.
Recommendations, sharing, tags, offline article downloads and separate bookmark sync are out of scope.
For v0.2, follow PLAN.md: OPML first, explicit toolbar discovery second, Firefox-bookmark Read Later third. Dropbox sync belongs to v0.3 and excludes bookmarks and article cache. Do not implement a milestone solely because it appears in memory.

## Verification
There is no package manager setup or automated test suite in the initial checkout. Do not invent npm commands.
For JavaScript changes, run `node --check background.js` and `node --check sidebar.js` when Node is available. Check manifest JSON when it changes.
For behavior changes, follow PLAN.md's focused verification requirements and include a manual Firefox checklist. Load manifest.json at about:debugging#/runtime/this-firefox to test the real extension. Syntax checks or tests in another browser do not establish Firefox behavior. State clearly what was actually tested.
Do not add runtime dependencies or a build pipeline for routine changes.

## Persistent project memory
MEMORY.md is repository-backed context, not automatic ChatGPT memory. Read it at session start and update it when a task changes decisions, project state, blockers or next steps.
Keep it concise and factual; link to detailed plans rather than duplicating them. Distinguish proposed, implemented, merged and verified work. Record tests actually run and unresolved checks. Never store credentials, personal feed lists or private user data.
Include relevant memory changes with the work's commit or pull request so future sessions can retrieve them. A local edit alone is not durable across cloud environments.
