# TailFlow Agent Guide

## Purpose

This document defines how AI agents should collaborate on TailFlow.

Before implementing features, prioritize preserving the project's long-term architecture over completing the current task. The goal is to build a maintainable, extensible workstation that can evolve for years without architectural drift.

---

# Session Bootstrap

Before planning or implementing any work, read the following documents in order:

1. `ARCHITECTURE.md`
2. `DOMAIN_MODEL.md`
3. `DECISIONS.md`
4. `ROADMAP.md`
5. `.ai/rule.md`
6. `.project/dev-loop.md`
7. `.project/tasks.md`

When a task touches a documented feature, also read the relevant document under `docs/`.

When working on frontend UI, read:

- `.github/ui-contract.md`

---

# Development Priorities

When several implementations are possible, always prefer the solution that:

- Preserves Single Responsibility Principle (SRP)
- Preserves the Open/Closed Principle (OCP)
- Keeps workflow modules independent
- Avoids unnecessary coupling
- Produces explicit, persistent artifacts
- Uses domain concepts instead of technical abstractions
- Is simple to understand (KISS)
- Avoids premature abstraction (YAGNI)
- Eliminates duplication only when it improves maintainability (DRY)

The architecture always takes priority over the shortest implementation.

---

# Architectural Review Before Implementation

Before introducing:

- new workflow modules
- new persistent data
- new services
- new abstractions
- new cross-cutting behavior

stop and evaluate whether the change aligns with `ARCHITECTURE.md`.

Prefer extending the architecture over introducing special cases.

If a feature feels difficult to integrate cleanly, identify the architectural problem instead of forcing an implementation.

---

# Domain-Driven Development

Prefer names that describe the domain rather than the implementation.

Good examples:

- Dataset
- TrainingExperiment
- DatasetExport
- Checkpoint
- Evaluation

Avoid generic names such as:

- Manager
- Helper
- Utility
- CommonService
- Misc

When naming new classes or modules, ask:

> "Would this name make sense to someone who understands LoRA training but not this codebase?"

---

# Workflow Module Principles

TailFlow is built around independent workflow modules.

Each module should:

- own a single responsibility
- own a single artifact type
- expose a well-defined interface
- avoid knowledge of other workflow modules

Modules communicate through shared project state and project artifacts rather than directly invoking one another.

Favor creating a new module over extending an unrelated one.

---

# Filesystem First

The filesystem is the source of truth.

The database exists only to index, cache, and accelerate access to project artifacts.

Whenever possible:

- derive state from the filesystem
- avoid storing information that can be reconstructed
- prefer explicit files over hidden database state

The application should be capable of rebuilding its internal state from the project directory.

---

# Avoid God Objects

Large classes, services, composables, or Vue components should not continuously accumulate responsibilities.

If a file begins handling multiple concerns, split it before adding additional functionality.

Large workflow modules should be decomposed into focused UI cards and backend services.

---

# Development Workflow

This repository uses the Development Loop system stored in:

- `.project/dev-loop.md`

Current work items are tracked in:

- `.project/tasks.md`

Before writing code:

1. Read the current development loop.
2. Review the active tasks.
3. Create a short implementation plan.
4. Break work into small, independently verifiable steps.
5. Validate each step before moving forward.
6. When a Decision Trigger occurs, document it in `DECISIONS.md` before implementation.

During development:

- Keep iterations small.
- Prefer focused validation before broad testing.
- Update development state whenever scope changes.

At the end of a work session:

- update `.project/dev-loop.md`
- update `.project/tasks.md`

The goal is that another session can resume work immediately.

---

# Testing Authority

Tests define expected behavior.

Agents must:

- fix implementation before considering test changes
- avoid modifying existing tests without explicit user approval
- add new tests whenever new behavior is introduced

Do not weaken tests simply to satisfy an implementation.

---

# Playwright Standards

Playwright tests must use the Page Object Model.

Responsibilities:

Spec files:

- describe user behavior
- contain assertions

Page Objects:

- contain selectors
- perform interactions
- encapsulate waits
- expose reusable operations

Selector preference:

1. Accessibility locators (`getByRole`, `getByLabel`, etc.)
2. `data-testid` when accessibility is insufficient
3. CSS selectors only as a last resort

---

# Documentation

Architectural decisions belong in:

- `DECISIONS.md`

Feature behavior belongs in:

- `docs/`

Long-term architectural vision belongs in:

- `ARCHITECTURE.md`

Development progress belongs in:

- `.project/dev-loop.md`
- `.project/tasks.md`

Keep documentation synchronized with implementation whenever behavior changes.

---

# Agent Mindset

Do not optimize only for the current task.

Optimize for the next year of development.

Every implementation should make the project easier—not harder—to extend.

When uncertain, choose the solution that:

- reduces coupling
- increases clarity
- preserves module independence
- improves long-term maintainability

TailFlow is intended to become a modular LoRA training workstation.

Every change should move the project closer to that vision.