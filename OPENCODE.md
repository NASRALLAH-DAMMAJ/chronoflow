# OpenCode Rules — ChronoFlow

## Workflow: Plan → Execute → Verify → Commit

### 1. Plan First
- **Always** create a todo list before starting work.
- Break the task into small, concrete steps.
- Show the plan to the user before executing.
- If the user says "go ahead", proceed step by step.

### 2. Execute in Small Steps
- Do one step at a time.
- After each step, verify it works (build, lint, or manual check).
- If something breaks, stop and report immediately. Do not continue.

### 3. Verify Before Committing
- **Always ask the user** before committing:
  - "Does this look correct?"
  - "Should I commit?"
- **Never commit without user approval.**
- If the user says it works → commit immediately with a clear message.
- If the user says it's broken → fix first, then ask again.

### 4. Commit Rules
- Commit messages: `type(scope): short description` (e.g., `fix(dial): sync innerR to 0.55`)
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`
- Stage only the files you changed. Never stage secrets or config with keys.
- Push to GitHub after commit unless told not to.

### 5. When Starting a Session
1. Read `ISSUES.md` for current open issues.
2. Read `README_V2.md` for current phase and next tasks.
3. Ask user what they want to work on.
4. Create a todo list for the session.

### 6. When Finishing a Session
1. Update `ISSUES.md` — mark completed issues `[x]`.
2. Update `README_V2.md` — mark completed tasks as done
3. Commit any uncommitted changes (with user approval).
4. Push to GitHub.
5. Report what was done and what's next.

---

## Rules

- **No assumptions.** If unsure, ask.
- **No silent changes.** Every file edit must be intentional and explained.
- **No commits without approval.** Always ask first.
- **No broken code.** Run build/lint before asking to commit.
- **No skipped tests.** If tests exist, run them before committing.
- **No long explanations.** Be concise. Show, don't tell.
- **No emojis unless asked.**
- **No unnecessary file reads.** Read only what you need.
- **No parallel edits to the same file** unless they don't overlap.
