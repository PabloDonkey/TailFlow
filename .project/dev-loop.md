# Development Loop

## Current Feature

Architecture Decision Log trigger integration

## Current Step

REFINE

Possible values:
PLAN
IMPLEMENT
TEST
REFINE

## Objective

Make ADR creation conditions explicit and integrate trigger handling into the documented workflow.

## Files involved

- DECISIONS.md
- AGENTS.MD

## Implementation Plan

1. define Decision Trigger rules in DECISIONS.md
2. add trigger-to-ADR workflow rule in AGENTS.MD

## Progress

- Added a new `When to Create a New Decision` section in `DECISIONS.md` with explicit Decision Triggers and an ADR checklist.
- Added a new development workflow rule in `AGENTS.MD`: when a Decision Trigger occurs, create a `DECISIONS.md` entry before implementation.

## Next Action

Use the trigger list during planning and PR review to decide when to open the next ADR entry.

## Notes

Update this file when stopping a development session so work can resume easily.
