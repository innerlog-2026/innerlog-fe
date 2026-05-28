---
name: commit
description: Create a commit following commit conventions
user-invocable: true
argument-hint: "optional message hint"
---

NEVER include AI/Claude mentions or Co-Authored-By lines
Create a git commit following conventions strictly.

## Steps

1. Run `git status` and `git diff --cached` (if nothing staged, run `git diff`)
2. Run `git log --oneline -1` to check the last commit
3. Analyze the changes and determine:
   - TYPE: FEAT, FIX, CHORE, REFACTOR, PERF, REVERT, or DOCS
   - scope: affected module/service name
4. **Amend decision**: If the staged/unstaged changes are closely related to the last commit (same scope, continuation of same work), propose `--amend` to the user. If in a monorepo, warn about force push triggering unrelated pipelines and prefer a new commit instead.
5. Draft commit message:
   - Subject: `TYPE(scope): description` — max 50 chars, imperative mood, no period
   - Body: required, use `-` bullet points, 72 chars/line
   - If amending, update the message to cover both original and new changes
6. NEVER include AI/Claude mentions or Co-Authored-By lines
7. Stage relevant files (specific files, not `git add -A`)
8. Commit using heredoc format (add `--amend` flag if amend was agreed)

If $ARGUMENTS is provided, use it as a hint for the commit message.