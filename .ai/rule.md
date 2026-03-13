# TailFlow AI Rules

- Read `.ai/rule.md` on startup before planning or implementation work.
- Start new work in plan mode by default.
- Before switching from plan mode to implementation, if the current branch is `main`, propose checking out a working branch first.
- Before code edits, explicitly propose the change, explain why it is needed, and name the file or files that will be modified.
- After editing any file, run an error check on the modified file(s) before moving on.
- Before any commit, run the full backend and frontend test suites and proceed only if they pass.
- Only store built-in AI memory when the user explicitly asks for it.
- When saving task artifacts, do not save full conversation history or long prompt/response summaries by default; store only concise task-focused artifact logs unless explicitly requested.
- When asked to review frontend UI quality or contract compliance, start with `.copilot/skills/ui-contract-review.md` in plan mode before proposing implementation changes.
- Keep directive or instructional guidance in this file.
- Track active session context in `.project/dev-loop.md` and `.project/tasks.md`.
- When a task is finished, update `.project/dev-loop.md` and `.project/tasks.md`.
