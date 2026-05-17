# Memory Bank Instructions

## On Every Task Start — Read These in Order

1. `memory-bank/project.md` → App overview, architecture, key features
2. `memory-bank/current-task.md` → What was last worked on, what's next
3. `memory-bank/decisions.md` → Architectural decisions and their rationale
4. `memory-bank/progress.md` → Completed features, pending tasks, known issues

**Do NOT rely on chat history. Memory bank is the single source of truth.**

---

## What Each File Contains

| File | Use it for |
|------|-----------|
| `project.md` | Tech stack, architecture, feature list |
| `current-task.md` | Active work, last session summary, next steps |
| `decisions.md` | WHY decisions were made (consult before changing architecture) |
| `progress.md` | Feature status, pending tasks, known bugs |

---

## After Major Changes — Update These

- **Always**: `progress.md` (mark tasks done/pending, add known issues)
- **Always**: `current-task.md` (update status, what was done, what's next)
- **Architecture changes**: `decisions.md` (log the decision, rationale, trade-offs)
- **Scope changes**: `project.md` (only if features or stack changed)

---

## Memory Bank Update Rules

- Keep entries short and factual — no long explanations
- Use checkboxes `✅ / [ ]` for tasks in `progress.md`
- Always include date on updates
- Never duplicate info across files — each file has one purpose
- If context grows large: summarize, update memory bank, suggest `/newtask`
