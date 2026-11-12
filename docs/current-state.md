# LiferRSS — working context

Last reviewed: 2026-11-12 (initial summary based on README.md and PLAN.md; verify against latest commits, issues and PRs)

## Project
Keyboard-first, local-first Firefox RSS/Atom reader implemented in plain JavaScript without a runtime build step. README.md is the introduction; PLAN.md is the authoritative delivery plan.

## Documented status
- README.md reports the v0.1 core reader was manually tested in Firefox and merged; v0.1.1 updates branding and release documentation without functional changes.
- PLAN.md still contains a pre-tag v0.1.1 checklist. **Do not assume the tag or release is pending** without checking GitHub tags/releases.
- Planned v0.2 delivery order: OPML import/export; quiet toolbar feed discovery; Firefox-bookmark-based Read Later; integration/release pass.
- v0.3: Dropbox sync for subscriptions, read states and settings, not bookmarks or article cache.

## Next session
1. Check main, recent PRs/issues, tags and releases; reconcile this status with the actual repository.
2. Identify the requested milestone or task and read its PLAN.md acceptance criteria.
3. Implement on a feature branch, test relevant behavior, and provide a manual Firefox test checklist.
4. Update this file only for verified material changes, with links to relevant PRs/issues.

## Guardrails
Keep the reader local-first and quiet. Do not add recommendations, sharing, tags, offline article downloads or a separate bookmark-sync system.

## Session log
- 2026-11-12: Created initial file-based project context workflow; no application behavior changed.
