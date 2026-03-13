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