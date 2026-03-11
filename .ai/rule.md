# TailFlow AI Rules

- Read `.ai/rule.md` first and `.ai/memory.md` second on startup before planning or implementation work.
- Start new work in plan mode by default.
- Before switching from plan mode to implementation, if the current branch is `main`, propose checking out a working branch first.
- Before code edits, explicitly propose the change, explain why it is needed, and name the file or files that will be modified.
- After editing any file, run an error check on the modified file(s) before moving on.
- Before any commit, run the full backend and frontend test suites and proceed only if they pass.
- Only store built-in AI memory when the user explicitly asks for it.
- Keep directive or instructional guidance in this file, not in `.ai/memory.md`.
- When a task is finished, update `.ai/memory.md` with any useful dated project facts needed to resume future work quickly.
