# TailFlow Testing Guide

This document is the canonical testing guide for backend, frontend, and end-to-end workflows.

## Principles

- Tests are the source of truth for expected behavior.
- Fix implementation to satisfy tests before considering test updates.
- Agent changes to existing test files require explicit user authorization in the active session.
- Prefer focused tests while iterating, then run broader suites before handoff.

## Test Layers

### Backend tests

- Framework: pytest (+ pytest-asyncio)
- Location: backend/tests
- Scope: API behavior, service logic, schema validation, configuration behavior

### Frontend unit/component tests

- Framework: Vitest + Vue Test Utils
- Location: frontend/src/__tests__
- Scope: component behavior, stores, route composition, UI state transitions

### Frontend E2E tests

- Framework: Playwright
- Location: frontend/e2e
- Scope: critical user flows and regression checks across desktop and mobile layouts

## E2E Architecture

- Use Page Object Model.
- Spec files contain high-level user journeys and assertions only.
- Page Object classes contain selectors and low-level interactions such as click/fill/wait.

Recommended structure:

- frontend/e2e/specs
- frontend/e2e/pages
- frontend/e2e/fixtures

## Selector Policy (Playwright)

Selector priority:

1. Accessibility-first locators (`getByRole`, `getByLabel`, accessible names)
2. Semantic text locators when role/label intent is clear
3. `data-testid` only as a justified exception when no stable accessible locator exists

Rules:

- Avoid CSS selectors for normal interactions.
- Add or improve accessible names/roles in UI code when locators are unstable.
- Keep selector details inside page objects, not in specs.

## Responsive Strategy

TailFlow has intentionally different desktop and mobile UI behaviors.

Use two Playwright projects:

- desktop-chromium
- mobile-chromium

Test taxonomy:

- Cross-viewport contract tests: run on both projects for core behavior parity.
- Mobile-specific tests (`@mobile`): sheet/panel interactions and mobile-only controls.
- Desktop-specific tests (`@desktop`): desktop-only layout and interaction expectations.

## Flake Prevention

- Prefer Playwright auto-waiting assertions (`expect(locator).toBeVisible()`, `toHaveURL()`, etc).
- Do not add manual sleep calls.
- Keep API/network setup deterministic in fixtures.
- Keep each test independent and isolated.

## Commands

### Root shortcuts

- make test
- make test-backend
- make test-frontend
- make test-e2e

### Backend

- cd backend && ./.venv/bin/python -m pytest
- cd backend && ./.venv/bin/python -m ruff check .
- cd backend && ./.venv/bin/python -m mypy .

### Frontend

- cd frontend && npm run test
- cd frontend && npm run lint
- cd frontend && npm run typecheck
- cd frontend && npm run build

### Frontend E2E

- cd frontend && npm run test:e2e
- cd frontend && npm run test:e2e:ui
- cd frontend && npm run test:e2e:headed

## CI Expectations

- Backend CI runs pytest + ruff.
- Frontend CI runs unit tests + build + E2E gate.
- E2E failures are blocking regressions for UI behavior.

## Authoritative References

- MDN Web Accessibility: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- Playwright Writing Tests: https://playwright.dev/docs/writing-tests

## Rule Summary for AI-assisted Changes

- Do not modify existing test files without explicit user authorization.
- Keep E2E specs high-level and enforce Page Object abstraction.
- Use accessibility-first locators by default and minimize `data-testid` usage.
