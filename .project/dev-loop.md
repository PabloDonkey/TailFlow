# Development Loop

## Current Feature

Frontend one-page responsive refactor planning

## Current Step

PLAN

Possible values:
PLAN
IMPLEMENT
TEST
REFINE

## Objective

Define a frontend refactor plan for a mobile+desktop responsive one-page tagging workflow with secondary actions hidden behind contextual navigation.

## Files involved

- .github/ui-contract.md
- frontend/src/router/index.ts
- frontend/src/pages/GalleryPage.vue
- frontend/src/pages/ImageDetailPage.vue
- frontend/src/pages/TagsPage.vue
- frontend/src/pages/OnboardingPage.vue

## Implementation Plan

1. choose primary navigation model (floating action menu vs collapsible side panel)
2. define target information architecture for project selection, tagging workspace, and secondary views
3. map current routes/pages to one-page shell behavior and responsive panel behavior
4. produce phased refactor backlog with low-risk implementation order

## Progress

- Updated `.github/ui-contract.md` to v2 with clearer component, layout, and implementation rules.
- Brainstormed two navigation models for the refactor: Option A (floating action menu) and Option B (collapsible side panel).
- Produced ASCII wireframes for both options on desktop and mobile.

## Next Action

Define the exact shell regions for desktop/mobile, the first-pass component tree, and the phased migration order from current pages into the new one-page frontend structure.

## Notes

Update this file when stopping a development session so work can resume easily.
