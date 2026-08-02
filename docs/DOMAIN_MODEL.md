# DOMAIN_MODEL.md

# TailFlow Domain Model

This document defines the ubiquitous language of TailFlow.

Every major feature, class, API, database model, workflow module, and UI component should map to one or more concepts defined here.

If a new concept cannot be described using this vocabulary, either:

* the concept does not belong in the application, or
* this document should evolve before implementation.

---

# Core Principles

* Domain concepts own responsibilities.
* Artifacts are produced by domain concepts.
* Workflow modules implement domain concepts.
* Implementation details (database, filesystem layout, Kohya, APIs, UI cards, etc.) are **not** domain concepts.

---

# Domain Overview

```
Project
│
├── Dataset
│   ├── Dataset Image
│   ├── Tag Set
│   └── Sanitized Dataset
│
├── Dataset Export
│
├── Training Experiment
│   ├── Training Configuration
│   ├── Training Run
│   └── Checkpoints
│
└── Evaluation
```

A Project is the root of every other domain concept.

## Implementation status

This document defines the full target vocabulary. Only part of it has code behind it today.

| Concept | Status |
|---|---|
| Project | **Implemented** — `projects` table, `services/projects.py` |
| Dataset | **Implemented** — the `dataset/` directory, reconciled by `sync_project()` |
| Dataset Image | **Implemented** — `dataset_images` table |
| Tag Catalog | **Implemented** — `tags` table, seeded from `assets/*.csv` |
| Tag Set | **Implemented** — `dataset_image_tag`, plus `.txt` sidecars on disk |
| Tag Proposal | **Implemented** — transient by design; see `CLASSIFIER.md` |
| Sanitized Dataset / Sanitization | **Vision only** |
| Dataset Export | **Vision only** |
| Training Experiment / Configuration / Run | **Vision only** |
| Checkpoint | **Vision only** |
| Evaluation | **Vision only** |

Vision-only sections below are still binding on naming: when those modules are built, they use these names and respect these ownership rules. They are not a description of existing code.

---

# Project

## Definition

A Project represents a complete LoRA creation workspace.

It is the root container for every artifact produced during the lifecycle of creating a LoRA.

A Project exists independently of the application and is primarily represented by its directory on disk.

## Owns

* Project metadata
* Dataset
* Dataset Exports
* Training Experiments
* Evaluations
* Project settings

## Does NOT Own

* Individual image processing
* Training execution
* Tag generation

Those belong to specialized domain concepts.

---

# Dataset

## Definition

A Dataset is the collection of images that will eventually be used to train a LoRA.

It evolves throughout the project lifecycle.

## Owns

* Dataset Images
* Dataset statistics
* Dataset metadata

## Does NOT Own

* Training configuration
* Checkpoints
* Evaluation

---

# Dataset Image

## Definition

A Dataset Image represents one training image within a Dataset.

It is the smallest independently editable training asset.

## Owns

* Original image
* Image metadata
* Associated Tag Set
* Sanitized versions
* Image-specific notes

## Does NOT Own

* Project metadata
* Training configuration

---

# Tag Catalog

## Definition

The Tag Catalog is the shared vocabulary available for tagging Dataset Images.

It defines valid tags but does not determine which tags belong to an image.

Examples include e621 tags and imported tag databases.

## Owns

* Tag definitions
* Tag metadata
* Categories
* External identifiers

---

# Tag Set

## Definition

A Tag Set is the collection of tags assigned to a single Dataset Image.

It represents the final prompt information that will be exported for training.

A Tag Set is **user-authored**, even when assisted by AI suggestions.

## How tags enter a Tag Set

Tags can enter a Tag Set through:

- manual user selection
- AI tag proposals (with confidence scores)
- imported tag metadata

However:

> AI does NOT assign tags directly to a Tag Set.

AI only produces **Tag Proposals**.

The user remains the final authority on what is included.

> AI suggestions are only a UI convenience and have no persistence or lifecycle tracking.

## Owns

- Ordered tags selected by the user
- Tag protection state (e.g. locked trigger/class tags)
- Prompt ordering

## Does NOT Own

- Global tag definitions (Tag Catalog)
- AI proposals or confidence scores

---

# Tag Proposal

## Definition

A Tag Proposal is a **transient AI-generated suggestion list** produced during image tagging.

It exists only as a response artifact from the AI classification process and is never persisted as domain state.

It is used to assist the user in selecting tags for a Dataset Image.

## Important Behavioral Rules

- Tag Proposals are ephemeral (request/UI lifetime only)
- Tag Proposals are NOT stored in the database
- Tag Proposals do NOT track acceptance or rejection history
- Tag Proposals do NOT affect Dataset Images unless explicitly selected by the user

## Contents

A Tag Proposal includes:

- tag reference (from Tag Catalog)
- confidence score
- optional metadata from the AI model

## Relationship to Tag Set

Tag Proposals are a **suggestion source only** for Tag Sets.

They do not modify Tag Sets directly.

User selection is the only mechanism that affects a Tag Set.

## Owns

- Suggested tags (temporary)
- Confidence scores
- Optional inference metadata

## Does NOT Own

- Tag Set
- Dataset Image
- Any persistent state

---

# Sanitization

## Definition

Sanitization transforms raw images into training-ready images.

This includes any operation that improves dataset quality while preserving the intended training concept.

Examples include:

* upscaling
* downscaling
* text removal
* blur correction
* character isolation
* background cleanup
* image rejection

## Owns

* Sanitized image artifacts
* Sanitization metadata
* Processing history

---

# Dataset Export

## Definition

A Dataset Export is a reproducible training dataset generated from a Dataset.

It converts project data into the format expected by training software.

Examples include numbered image files and prompt sidecars.

## Owns

* Exported images
* Prompt text files
* Export metadata

## Does NOT Own

* Training configuration

---

# Training Experiment

## Definition

A Training Experiment represents one attempt to train a LoRA.

Experiments are intentionally repeatable.

Multiple experiments may exist within a single Project.

## Owns

* Training Configuration
* Training Runs
* Generated Checkpoints
* Experiment notes

## Does NOT Own

* Dataset editing

---

# Training Configuration

## Definition

A Training Configuration describes how a Training Experiment should execute.

Examples include:

* learning rate
* optimizer
* scheduler
* network dimensions
* epochs
* repeats

The configuration is independent of the training backend.

It describes intent rather than implementation.

---

# Training Run

## Definition

A Training Run is one execution of a Training Experiment.

A Training Experiment may contain multiple runs.

Runs produce logs, progress information, and checkpoints.

## Owns

* Runtime logs
* Runtime metadata
* Execution status

---

# Checkpoint

## Definition

A Checkpoint is a model produced during a Training Run.

A Checkpoint is a persistent artifact that can be tested, compared, or selected.

## Owns

* Model file
* Epoch or step information
* Preview metadata
* User annotations

---

# Evaluation

## Definition

Evaluation captures human judgement about one or more Checkpoints.

Evaluation determines which checkpoint best satisfies the intended training objective.

Evaluation is intentionally subjective.

## Owns

* Ratings
* Notes
* Comparisons
* Selected checkpoint

---

# Workflow Module

## Definition

A Workflow Module is the implementation responsible for one domain concept.

Modules expose functionality to the user but do not define the domain.

Examples include:

* Dataset Module
* Tagging Module
* Sanitization Module
* Export Module
* Training Module
* Evaluation Module

Every Workflow Module should have a single primary responsibility.

---

# Artifact Philosophy

Every meaningful workflow stage should produce persistent artifacts.

Artifacts should be inspectable by users.

Artifacts should remain available for future iterations.

Nothing essential should exist only in memory.

Typical artifact flow:

```
Raw Dataset
        │
        ▼
Sanitized Dataset
        │
        ▼
Tag Sets
        │
        ▼
Dataset Export
        │
        ▼
Training Configuration
        │
        ▼
Training Run
        │
        ▼
Checkpoints
        │
        ▼
Evaluation
```

---

# Ownership Rules

Every responsibility must have exactly one owner.

Examples:

* A Dataset owns Dataset Images.
* A Dataset Image owns its Tag Set.
* A Tag Catalog owns tag definitions.
* A Training Experiment owns Training Runs.
* A Training Run owns produced Checkpoints.
* An Evaluation owns ratings and notes.

Avoid responsibilities shared across multiple domain concepts.

* Tag Proposals are NOT domain-owned artifacts.
  They are transient computation results and must not be treated as persistent entities.
---

# Ubiquitous Language

The following vocabulary should be used consistently throughout the project:

| Preferred           | Avoid                              |
| ------------------- | ---------------------------------- |
| Project             | Workspace (when referring to data) |
| Dataset             | Image Collection                   |
| Dataset Image       | Image Record                       |
| Tag Catalog         | Global Tags                        |
| Tag Set             | Image Tags                         |
| Sanitization        | Image Cleanup                      |
| Dataset Export      | Export Job                         |
| Training Experiment | Training Session                   |
| Training Run        | Backend Run                        |
| Checkpoint          | Output Model                       |
| Evaluation          | Review                             |
| Workflow Module     | Feature                            |

Consistency of language is considered part of the architecture.

When introducing new concepts, prefer extending this vocabulary rather than inventing new terminology.
