# Skill: save-task-artifacts

**Purpose:** Save AI outputs relevant to the current dev-loop task.

## Steps

1. Read `.project/dev-loop.md` to identify the **current task** and task ID.

2. If no folder exists for this task, create:

```
.project/tasks/<task-id>/
```

3. Save AI outputs to the task folder. Examples:

* `ascii-wireframe.txt` → ASCII layout sketches
* `notes.md` → brainstorming and planning notes
* `mockup.png` → rough sketches (if generated externally)
* `ai-session.md` → chat session or prompt/response snippets

4. Update `.project/dev-loop.md` under **Notes / Resources**:

```md
## Notes / Resources
See .project/tasks/<task-id>/
```

5. Keep outputs **organized by type** and do not overwrite existing files unless explicitly told.

6. Optional: archive temporary files (e.g., AI scratch outputs) in `.project/.ai-cache/` if not permanently useful.

## Usage

The developer or AI agent can trigger this skill with:

```
save-task-artifacts
```

Typical use cases:

* After generating a wireframe or layout with AI
* After brainstorming UI/UX options
* After a planning session with AI outputs

The skill **automatically organizes all outputs** in the correct task folder and updates the dev-loop.
