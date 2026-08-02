# TailFlow Architecture Decision Log

This file records major architectural and technical decisions for TailFlow.
Its goal is to preserve context about why decisions were made so future contributors and AI tools can make consistent changes.

## How to use this log

- Add a new ADR for major architectural or tooling decisions.
- Use sequential IDs (`ADR-001`, `ADR-002`, ...).
- Do not renumber existing ADRs.
- If a decision changes, add a new ADR and mark the previous one as superseded.

## When to Create a New Decision

Create a new ADR when any of the following Decision Triggers occurs:

- A new core framework or platform is introduced (backend, frontend, database, build tooling).
- A major dependency with long-term impact is added or replaced.
- The project architecture changes (for example monolith ↔ split services, sync ↔ async, API contract model changes).
- The repository structure changes in a way that affects team workflows or boundaries (new top-level domains, major folder reorganization).
- A new state management or data-flow pattern is adopted.
- A new external integration is introduced (third-party APIs, auth providers, cloud services, message brokers).
- A development workflow standard is introduced or changed (test gates, release process, branch policy, AI workflow rules).
- A performance/scalability decision changes system behavior or constraints (caching strategy, queueing, storage model, concurrency model).
- A security/compliance decision changes architectural constraints (secrets handling, data retention, access boundaries).
- A previous ADR is superseded, deprecated, or materially revised.

ADR creation checklist:

- Record Context, Options considered, Decision, and Consequences.
- Assign the next sequential ADR number.
- Link related PRs/issues/docs.
- Mark superseded ADRs explicitly instead of editing history.

## Index

| ADR | Title | Status | Date |
| --- | ----- | ------ | ---- |
| ADR-001 | Backend Framework and Python Learning Path | Accepted | 2026-03-13 |
| ADR-002 | Frontend Framework Selection | Accepted | 2026-03-13 |
| ADR-003 | Repository Boundary: Backend and Frontend Split | Accepted | 2026-03-13 |
| ADR-004 | Shared Frontend State Management with Pinia | Accepted | 2026-03-13 |
| ADR-005 | Runtime API Contract Validation with Zod | Accepted | 2026-03-13 |
| ADR-006 | Standardized Development Loop and Commands | Accepted | 2026-03-13 |
| ADR-007 | Concise AI Task Artifact Logging | Accepted | 2026-03-13 |
| ADR-008 | UI Contract Review Planning Workflow | Accepted | 2026-03-13 |
| ADR-009 | Test Authority and Accessibility-First E2E Policy | Accepted | 2026-04-25 |
| ADR-010 | Claude-Native Documentation Structure | Accepted | 2026-08-01 |
| ADR-011 | Canonical Tag Names | Accepted | 2026-08-02 |

---

## ADR-001: Backend Framework and Python Learning Path

**Status:** Accepted  
**Date:** 2026-03-13

### Context

The project needed a modern backend API stack, and the project owner wanted to learn Python through practical development.

### Options considered

- FastAPI + async SQLAlchemy + Pydantic
- Flask ecosystem
- Django ecosystem

### Decision

Use FastAPI with async SQLAlchemy and Pydantic as the backend foundation.

### Consequences

- Positive: modern Python patterns, strong typing support, and built-in API documentation.
- Positive: good fit for learning Python while building production-style services.
- Tradeoff: added async and ORM complexity compared with smaller synchronous stacks.

---

## ADR-002: Frontend Framework Selection

**Status:** Accepted  
**Date:** 2026-03-13

### Context

The UI needed to stay readable and well compartmentalized, and the project owner had the most familiarity with Vue among JavaScript UI frameworks.

### Options considered

- Vue
- React
- Svelte

### Decision

Use Vue as the frontend framework.

### Consequences

- Positive: component structure aligns with desired compartmentalized UI design.
- Positive: existing familiarity improves development speed and confidence.
- Tradeoff: ecosystem choices center on Vue-specific tooling and patterns.

---

## ADR-003: Repository Boundary: Backend and Frontend Split

**Status:** Accepted  
**Date:** 2026-03-13

### Context

The application has two clear domains: API/data services and browser UI.

### Options considered

- Single mixed source tree
- Separate backend and frontend folders within one repository
- Separate repositories

### Decision

Use a single repository with explicit top-level `backend/` and `frontend/` boundaries.

### Consequences

- Positive: strong separation of concerns between API and UI code.
- Positive: each side can evolve and be tested with focused tooling and commands.
- Tradeoff: requires coordination for cross-layer changes and shared conventions.

---

## ADR-004: Shared Frontend State Management with Pinia

**Status:** Accepted  
**Date:** 2026-03-13

### Context

The app requires shared state across routes and views (for example projects, images, and tags), and local component-only state would become fragmented.

### Options considered

- Local component state only
- Pinia centralized stores
- Alternative global state libraries

### Decision

Use Pinia stores to centralize shared frontend state.

### Consequences

- Positive: predictable cross-page state behavior and simpler data flow.
- Positive: clearer async loading and error handling patterns in one place.
- Tradeoff: introduces store design/maintenance overhead versus local-only state.

---

## ADR-005: Runtime API Contract Validation with Zod

**Status:** Accepted  
**Date:** 2026-03-13

### Context

Backend and frontend evolve in parallel, and rapid iteration can cause API shape mismatches.

### Options considered

- Trust raw JSON responses
- Validate responses at runtime with Zod
- Rely only on compile-time typing

### Decision

Validate frontend API responses at runtime with Zod.

### Consequences

- Positive: catches contract drift early and closer to the point of failure.
- Positive: improves robustness while interfaces change during active development.
- Tradeoff: additional schema maintenance and runtime validation work.

---

## ADR-006: Standardized Development Loop and Commands

**Status:** Accepted  
**Date:** 2026-03-13

### Context

The project needs a consistent development workflow and a way to resume interrupted work with minimal context loss.

### Options considered

- Ad-hoc per-developer commands and notes
- Standardized Makefile commands plus dev-loop context files
- Fully scripted automation only

### Decision

Use standardized Makefile-driven commands and maintain progress context in `.project/dev-loop.md` and `.project/tasks.md`.

### Consequences

- Positive: consistent setup/test/run flow and easier onboarding.
- Positive: smoother session handoff and resumability.
- Tradeoff: requires discipline to keep workflow metadata up to date.

---

## ADR-007: Concise AI Task Artifact Logging

**Status:** Accepted — mechanism amended by ADR-010  
**Date:** 2026-03-13

> **Amendment (ADR-010, 2026-08-01):** the decision stands unchanged. Its delivery mechanism, `.copilot/skills/save-task-artifacts.md`, was removed; the rule now lives in the dev-loop tracking section of `CLAUDE.md`.

### Context

Saving task artifacts is useful for resumability, but storing or reconstructing long conversation-history summaries slows interactions and creates noisy project artifacts.

### Options considered

- Save full AI session transcripts by default
- Save concise task-focused artifact logs by default
- Do not save AI task artifacts at all

### Decision

When persisting AI task artifacts, default to concise artifact logs only. Do not save full conversation transcripts or long prompt/response summaries unless explicitly requested.

### Consequences

- Positive: reduces latency and unnecessary summarization work.
- Positive: keeps task folders focused on decisions, outputs, and follow-up steps.
- Tradeoff: some conversational nuance is omitted unless explicitly preserved.

---

## ADR-008: UI Contract Review Planning Workflow

**Status:** Accepted — mechanism amended by ADR-010  
**Date:** 2026-03-13

### Context

The frontend now has a written UI contract, but review requests need a repeatable workflow that finds violations, stays in plan mode, and asks the developer before applying changes.

### Options considered

- Ad-hoc UI review on each request
- A dedicated UI-contract review skill that plans fixes before implementation
- Immediate auto-fix behavior without a planning step

### Decision

Use a dedicated `ui-contract-review` skill for frontend UI audits. The workflow must identify contract violations, produce a remediation plan in plan mode, and ask the developer whether to apply fixes or continue planning.

> **Amendment (ADR-010, 2026-08-01):** the workflow stands unchanged. It is no longer a separate skill file — `.copilot/skills/ui-contract-review.md` was folded into the **Review checklist** section of `docs/UI_CONTRACT.md`, alongside the contract it checks against.

### Consequences

- Positive: makes UI audits consistent and aligned with the written contract.
- Positive: reduces accidental UI edits before the developer confirms scope.
- Tradeoff: adds an extra planning step before implementation work.

---

## ADR-009: Test Authority and Accessibility-First E2E Policy

**Status:** Accepted  
**Date:** 2026-04-25

### Context

As UI surface area grows across desktop and mobile views, regressions become harder to detect using only unit/component tests. The project needs a stronger, behavior-focused feedback signal for AI-assisted implementation while preserving developer ownership of test intent.

### Options considered

- Keep current test model (backend pytest + frontend vitest only)
- Add Playwright E2E but allow agent-driven test edits during implementation
- Add Playwright E2E and treat tests as authoritative artifacts that agents cannot edit without explicit authorization

### Decision

Adopt Playwright E2E as a required UI regression signal and enforce test authority rules:

1. Tests are source of truth for behavior.
2. Agents must fix implementation to satisfy tests before changing tests.
3. Agents cannot modify existing test files without explicit user authorization in the active session.
4. Playwright tests must use Page Object Model (specs stay high-level; page objects own selectors/interactions).
5. Locator strategy is accessibility-first (`getByRole`, `getByLabel`, accessible names), with minimal justified `data-testid` usage and no routine CSS selector targeting.

### Consequences

- Positive: stronger regression protection for desktop and mobile workflows.
- Positive: preserves developer control over expected behavior encoded by tests.
- Positive: encourages accessible UI semantics through ARIA-first locator practices.
- Tradeoff: implementation may take longer when UI semantics must be improved to support robust accessible locators.
- Tradeoff: stricter guardrails require explicit authorization when tests genuinely need updates.
---

## ADR-010: Claude-Native Documentation Structure

**Status:** Accepted  
**Date:** 2026-08-01

### Context

Project knowledge had accumulated across nine documents written for a Copilot-based workflow: `AGENTS.md`, `.ai/rule.md`, four skill files under `.copilot/skills/`, `.github/ui-contract.md`, and five documents at the repository root. Three problems had emerged.

First, every one of those documents was **prescriptive** — SRP, filesystem-first, do not modify tests — and none was **descriptive**. There was no route reference, no schema reference, no explanation of the workspace card registry, and no classifier setup guide. A new contributor or agent had to read source to answer basic questions.

Second, `ARCHITECTURE.md` and `DOMAIN_MODEL.md` describe a six-stage LoRA workflow, but only two stages exist in code. Nothing marked the difference, so both documents read as descriptions of a system that does not exist.

Third, guidance was duplicated and drifting across `AGENTS.md`, `.ai/rule.md`, and the `.copilot/skills/` files, with no single entry point. Claude Code reads `CLAUDE.md` by convention, and the repository had none.

### Options considered

- Keep the existing structure and add a thin `CLAUDE.md` pointing at `AGENTS.md`.
- Keep both agent formats in sync — `CLAUDE.md` and `AGENTS.md` maintained in parallel.
- Consolidate into a single `CLAUDE.md` entry point plus a flat `docs/` of reference documents, and retire the Copilot-era files.

### Decision

Consolidate. Specifically:

1. `CLAUDE.md` at the repository root is the single agent entry point. It absorbs `AGENTS.md` and `.ai/rule.md`, and covers commands, architecture as built, invariants, working agreements, gotchas, a documentation map, and dev-loop tracking.
2. All reference documentation lives in a flat `docs/` directory using `SCREAMING_SNAKE_CASE.md` names, one file per concern. Root-level `ARCHITECTURE.md`, `DOMAIN_MODEL.md`, `DECISIONS.md`, `TESTING.md`, and `ROADMAP.md` moved there; `project-dataset-workflow.md` and `tag-import-plan.md` were renamed to match.
3. Four descriptive references were written to close the gap: `API.md`, `DATABASE_MODEL.md`, `WORKSPACE_CARDS.md`, and `CLASSIFIER.md`.
4. `ARCHITECTURE.md` and `DOMAIN_MODEL.md` gained implementation-status tables distinguishing built modules from vision. Superseded content is marked rather than deleted.
5. `AGENTS.md`, `.ai/rule.md`, `.copilot/`, and `.github/ui-contract.md` are removed after their content was absorbed. `.github/ui-contract.md` became `docs/UI_CONTRACT.md`, folding in the review checklist from `.copilot/skills/ui-contract-review.md`; `list_changed_vue_files.sh` moved to `scripts/`.
6. `.project/` remains gitignored local session tracking, unchanged, and is documented from `CLAUDE.md`.

### Consequences

- Positive: one entry point, so guidance cannot drift between agent formats.
- Positive: descriptive documentation now exists for the API, schema, card system, and classifier — the areas that previously required reading source.
- Positive: readers can tell implemented modules from planned ones.
- Positive: documentation lives beside the code and is expected to be updated in the same commit as a behavior change.
- Tradeoff: the repository is now specific to Claude Code. Reintroducing another agent tool means either a pointer file or duplicated guidance.
- Tradeoff: descriptive documentation drifts as code changes. The status tables and gotcha lists in particular need review whenever the areas they describe are touched.

---

## ADR-011: Canonical Tag Names

**Status:** Accepted  
**Date:** 2026-08-02

### Context

TailFlow had two different normalization rules for tag names depending on how a tag entered the system. The classifier canonicalized to `"_".join(name.strip().lower().split())`, while sidecar import, manual tag addition, and `POST /api/tags` applied only `.strip()`. The same concept therefore produced different `Tag` rows depending on its entry path, and nothing in the schema prevented it.

This surfaced when loading a real dataset of 274 images. The `.txt` sidecars were internally inconsistent — some projects wrote `simple_background`, others `simple background` — and the import created **943 user-defined tags, 787 of which duplicated an existing catalog tag**. Roughly half of all tag assignments pointed at these orphans, which carry no category and no external catalog IDs.

Cleaning this up in the database alone was not durable: because `_resolve_sync_project_tag` looks tags up by exact name, the next `sync` of any project recreated every orphan from the unchanged sidecars. The alternative — rewriting the user's `.txt` files — would edit training data to work around an application defect.

A second, latent problem: `_validate_distinct_project_tags` compared raw strings, so a project could be created with `trigger_tag="Flippy"` and `class_tag="flippy"`, which are distinct strings but the same tag.

### Options considered

- Normalize the `.txt` sidecars on disk and leave the code unchanged.
- Add a `UNIQUE` index on a canonical expression and let inserts fail.
- Canonicalize at every point where a string becomes a `Tag`, and migrate existing data.

### Decision

Tag identity is the **canonical name**. `app/core/tag_names.canonical_tag_name()` is the single rule — strip, lowercase, and collapse each run of whitespace into one underscore — and every path that turns a string into a `Tag` applies it:

1. `get_or_create_tag` canonicalizes for both the lookup and the insert.
2. `_resolve_manual_project_tag` and `_resolve_sync_project_tag` canonicalize before their lookup, since they query by name before reaching `get_or_create_tag`.
3. `_normalize_unique_tag_names` canonicalizes, which keeps add lists, remove lists, and the protected-tag comparison consistent with each other.
4. `TagCreate.normalize_name` canonicalizes, so `POST /api/tags` returns 409 for a spelling variant of an existing tag.
5. The classifier's inline expression was replaced by a call to the shared helper.
6. Catalog CSV import canonicalizes, which is a no-op for already-canonical rows.
7. `Project.trigger_tag` and `class_tag` are canonicalized on write, in `create_project`, `update_project_metadata`, and discovery. This also fixes the `Flippy`/`flippy` distinctness bug.

Sidecar files are **not** rewritten. They remain the source of truth in whatever spelling their author used; canonicalization happens on read.

Migration `0007` folds existing duplicates: it picks a survivor per canonical group preferring a catalog-backed tag, carries catalog IDs and category onto it, collapses duplicate assignments per image keeping the protected link, repoints the rest, deletes the losers, and canonicalizes tag and project columns.

### Consequences

- Positive: `sync` is idempotent. Re-running it no longer creates tags, so database cleanups stay clean.
- Positive: sidecar tags land on real catalog tags, gaining category and external IDs, and AI proposals stop appearing to duplicate tags an image already has.
- Positive: one rule replaces two, so there is no longer a "which path did this tag come from" question.
- Positive: users' training data is never modified to satisfy the application.
- Tradeoff: intentional casing in user-defined tags is lost — `BelzTattoo` becomes `belztattoo`. Judged acceptable because catalog convention is lowercase and the alternative is ambiguous identity.
- Tradeoff: the merge in `0007` is lossy and its `downgrade()` is a documented no-op. Original spellings can only be recovered by re-syncing from the sidecars.
- Limitation: the rule normalizes whitespace and case only. It does not reconcile punctuation spacing, so `pussy-cat(meme)` and `pussy-cat_(meme)` remain distinct tags. Encoding an e621-specific qualifier heuristic was judged more dangerous than leaving those as data-level typos.
