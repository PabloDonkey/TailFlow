# Skill: update-dev-loop

Purpose: Update `.project/dev-loop.md` at the end of a development session.

## Steps

1. Read the current file:

.project/dev-loop.md

2. Analyze the repository to detect:

* files modified during the session
* new components or modules created
* major architectural changes

3. Summarize the development work completed.

4. Update the following sections in `.project/dev-loop.md`:

Progress
Files involved
Next Action

Rules:

* Do NOT remove previous useful information
* Keep updates concise
* Maintain the existing file structure

5. If tasks were completed, suggest updates to `.project/tasks.md`.

## Output

Provide:

1. The updated dev-loop content
2. A short summary of what was completed
3. The next recommended development action

## Usage

The developer triggers this skill with:

update-dev-loop

Typical use case:
Run this command at the end of a coding session to persist progress.
