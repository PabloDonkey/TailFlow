# Skill: save-task-artifacts

**Purpose:** Save AI outputs relevant to the current dev-loop task.

**Important:** Do not save or reconstruct full conversation history by default. Keep artifacts concise and task-focused.

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
* `artifact-log-YYYY-MM-DD.md` → short artifact log with prompt summary, decisions, outputs, and follow-up

4. Never save full chat transcripts, prompt/response dumps, or long conversation-history summaries unless the user explicitly asks for them.

5. If session context is worth preserving, store only a compact artifact log:

```md
# AI Session Artifact Log (YYYY-MM-DD)

## Task
- `<task-id>`

## Prompt Summary
- short bullet
- short bullet

## Decisions Captured
- short bullet

## Artifacts Produced
- `artifact-name.ext`

## Follow-up
- short bullet
```

Keep each section brief and factual. Prefer bullets over prose.

6. Update `.project/dev-loop.md` under **Notes / Resources**:

```md
## Notes / Resources
See .project/tasks/<task-id>/
```

7. Keep outputs **organized by type** and do not overwrite existing files unless explicitly told.

8. Optional: archive temporary files (e.g., AI scratch outputs) in `.project/.ai-cache/` if not permanently useful.

## Usage

The developer or AI agent can trigger this skill with:

```
save-task-artifacts
```

Typical use cases:

* After generating a wireframe or layout with AI
* After brainstorming UI/UX options
* After a planning session with AI outputs

The skill **automatically organizes concise outputs** in the correct task folder and updates the dev-loop.
