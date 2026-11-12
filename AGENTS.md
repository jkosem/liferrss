# Working on LiferRSS

## Start each ChatGPT Work / Codex task
- Read README.md, PLAN.md, and docs/current-state.md; consult docs/decisions.md for decisions.
- Verify current branch, code, and relevant GitHub issues/PRs before trusting a status note.
- Repository documents are the durable project context; do not depend on ChatGPT account memory.
- Keep LiferRSS context separate from other repositories.

## Product and implementation
- Preserve a small, keyboard-first, local-first Firefox RSS/Atom reader.
- Prefer plain JavaScript and browser extension APIs without a runtime build step.
- Preserve subscription and read/unread data across changes; display feed summaries safely as text.
- Follow the v0.2 order and acceptance criteria in PLAN.md. Do not silently expand scope.
- No recommendations, sharing, tags, offline article downloads, or separate bookmark sync.

## Delivery and context maintenance
- Work in reviewable branches and pull requests, not directly on main.
- Include focused validation and a manual Firefox test checklist for behavior changes.
- At the end of substantive tasks, update docs/current-state.md with verified progress, blockers and next actions.
- Record accepted consequential decisions in docs/decisions.md; distinguish proposals from approvals.
- Keep notes concise, dated, non-sensitive, and linked to relevant issues/PRs. Do not overwrite established product documents with a summary.
- Never store secrets or personal information in context files.
