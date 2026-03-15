# Skill: ui-contract-review

Purpose: Review frontend UI elements against `.github/ui-contract.md`, identify contract violations, and produce a plan-only remediation report before any fixes are applied.

## When to use

Use this skill when:

- reviewing existing frontend UI for contract compliance
- before refactoring a page or component-heavy UI area
- when the developer suspects raw HTML, duplicated styling, or misplaced UI logic
- when the developer asks for a UI audit before implementation

## Required inputs

- target files, folders, or UI area to review
- current task context from `.project/dev-loop.md` if relevant

Special scope option:

- `changed-vue-current-branch` → resolve scope using `.copilot/scripts/list_changed_vue_files.sh`

## Steps

1. Read the following files first:

- `.github/ui-contract.md`
- `.ai/rule.md`
- `AGENTS.MD`
- any target frontend files under review

If the developer asks to review changed Vue files in the current branch, first run:

`bash .copilot/scripts/list_changed_vue_files.sh`

Use the returned file list as the review scope. Do not replace this with an ad-hoc git command when this helper is available.

2. Review the target UI against the contract and check for issues such as:

- raw repeated HTML where a shared UI primitive should be used
- duplicated styling or ad hoc styling that should be extracted
- route/page files holding too much presentational markup
- business/state logic embedded in presentational components
- missing reusable components where repetition exists
- naming or placement that violates the folder/naming rules
- custom CSS that should reasonably be Tailwind utility usage
- oversized components that should be split

3. Produce a findings list grouped by file. For each issue, include:

- file
- affected element/component
- violated contract rule
- why it violates the rule
- suggested fix direction
- estimated impact (`low`, `medium`, `high`)

4. Stay in **PLAN mode**.

5. Build a remediation plan that:

- orders fixes from lowest-risk to highest-risk
- separates primitive extraction from composition changes
- calls out any uncertain areas needing product or UX confirmation
- names the files likely to change

6. Do **not** apply fixes automatically.

7. End by asking the developer to choose one of these next actions:

- apply the proposed fixes now
- refine the plan further
- limit the review to a smaller scope

## Output format

### UI Contract Review

#### Scope
- reviewed files/folders

#### Findings
- `[impact]` file — element/component — violated rule — suggested fix

#### Remediation Plan
1. concrete fix step
2. concrete fix step

#### Files Likely to Change
- path

#### Decision Needed
- Apply fixes now, or continue planning?

## Rules

- Default to concise findings, not long prose.
- Prefer actionable fixes over abstract commentary.
- If no issues are found, explicitly say the reviewed scope appears compliant.
- If the scope is broad, suggest a phased review order instead of forcing a massive audit.

## Usage

The developer can trigger this skill by writing:

`ui-contract-review`

Examples:

- `ui-contract-review frontend/src/components/layout`
- `ui-contract-review frontend/src/pages/WorkspacePage.vue`
- `ui-contract-review frontend/src`
- `ui-contract-review changed-vue-current-branch`