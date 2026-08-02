# Architecture Vision

> **This document describes the target architecture, most of which is not built yet.** See the status table below before assuming a module exists. For how the code is actually structured today, read `CLAUDE.md` and the reference documents it links.

## Implementation status

| Workflow stage | Status |
|---|---|
| Dataset Collection | **Implemented** — project discovery, sync, upload, replace, delete, dataset rename |
| AI Tagging | **Implemented** — shared tag catalogs, tagging modes, protected tags, JTP classifier proposals, `.txt` sidecars |
| Dataset Sanitization | **Vision only** — no code exists |
| Dataset Export | **Vision only** — no code exists |
| Training | **Vision only** — no code exists. See `AQUA_TRAINING_HANDOFF.md` for the external handoff that stands in for it today |
| Checkpoint Evaluation | **Vision only** — no code exists |

The two implemented stages live in `backend/app/services/projects.py` and `backend/app/services/classifier.py`, surfaced through the workspace card system described in `WORKSPACE_CARDS.md`.

The principles below apply to everything, built or not. The module list is aspirational.

## Mission

This application is a modular, local workstation dedicated to creating high-quality furry SDXL LoRAs.

It guides the user through the complete iterative LoRA creation workflow, from dataset collection to checkpoint evaluation. The goal is not to automate every decision, but to provide specialized tools that make each step of the workflow faster, safer, and more reproducible.

The application intentionally targets a single-user offline workflow running on a workstation equipped with an NVIDIA GPU.

---

# Project Scope

The project focuses exclusively on furry SDXL LoRA creation.

Supported domains include:

- Character LoRAs
- Style LoRAs
- Concept LoRAs

The application may use other AI models (such as FLUX) for dataset sanitization tasks, but SDXL LoRA training remains the primary objective.

Out of scope:

- Cloud synchronization
- Authentication
- Multi-user collaboration
- Generic machine learning workflows
- Non-furry datasets

---

# Workflow Philosophy

LoRA creation is an iterative process rather than a linear pipeline.

A user may freely move between workflow stages at any time.

Typical workflow:

Dataset Collection
→ Dataset Sanitization
→ AI Tagging
→ Dataset Export
→ Training
→ Checkpoint Evaluation
→ Repeat

Iteration is expected and is considered a first-class workflow.

---

# Architectural Principles

## Filesystem is the Source of Truth

A project exists primarily on disk.

The application should always be capable of rebuilding its internal state by scanning the project directory.

Databases are considered indexes and caches rather than authoritative storage.

---

## Every Workflow Stage Produces Persistent Artifacts

Each stage generates inspectable files.

Examples include:

- Sanitized images
- Prompt text files
- Exported datasets
- Training configurations
- TOML files
- Training checkpoints
- Evaluation results

Nothing important should exist only in memory.

---

## Workflow Modules Are Independent

Each workflow capability is implemented as an independent module.

Modules communicate through shared project artifacts and metadata rather than directly invoking one another.

A module should never own another module.

---

## Users Control Navigation

The application never forces a linear workflow.

Each module determines whether it is ready to operate based on the current project state.

Unavailable actions should explain why they are unavailable instead of assuming previous steps have been completed.

---

## Single Responsibility

Every module owns a single responsibility.

Examples:

Dataset Module
- dataset management

Sanitization Module
- image cleanup

Tagging Module
- AI-assisted tagging

Export Module
- dataset export

Training Module
- training configuration and execution

Evaluation Module
- checkpoint comparison and evaluation

Large modules should be decomposed into focused UI cards and backend services.

---

## Open for Extension

New workflow modules should be addable with minimal modification to existing code.

Extensibility is preferred over special-case logic.

---

# Core Domain Concepts

The project revolves around these concepts:

Project

Dataset

Sanitized Dataset

Tags

Exported Dataset

Training Experiment

Training Configuration

Checkpoint

Evaluation

Artifacts produced by these concepts form the long-term history of a project.

---

# Design Philosophy

The project favors:

- SOLID
- SRP above all
- Open/Closed Principle
- DRY
- KISS
- YAGNI

The goal is maintainability over cleverness.

Code should optimize for long-term evolution rather than short-term implementation speed.

---

# Long-Term Goal

The application should become a modular workstation where new workflow modules can be added without requiring architectural changes elsewhere in the system.

The architecture should encourage experimentation, reproducibility, and iterative improvement of LoRA training projects.