---
name: frontend-testing
description: Build and improve frontend test suites using unit, integration, and end-to-end patterns. Use when users ask to add tests, fix flaky frontend tests, increase coverage, test React/Next.js UI behavior, validate user flows, or set up testing strategy for components and pages.
---

Design reliable frontend tests that catch regressions without slowing development.

## Testing Strategy

Use a balanced test pyramid:
- Unit tests for pure logic and isolated component behavior.
- Integration tests for component interactions, state, routing, and data boundaries.
- End-to-end tests for critical user journeys in real browser conditions.

Prefer fast, deterministic tests first, then cover business-critical flows with higher-level tests.

## Framework-Specific References

When a user asks for concrete setup or starter tests, load references/jest-vitest-playwright.md.

When a user asks for Next.js App Router specifics, server component patterns, or route handler tests, load references/nextjs-app-router-testing.md.

- Use Vitest examples for Vite-native or modern TypeScript setups.
- Use Jest examples for projects already standardized on Jest.
- Use Playwright examples for end-to-end flow coverage and browser-level confidence.
- Use Next.js-specific examples for App Router pages, server component boundaries, and route handlers.

## Workflow

1. Define behavior and risk
- Identify what must never break: auth gates, checkout, navigation, forms, and key content paths.
- Write tests around user-observable behavior, not implementation internals.

2. Pick the right level
- Unit: utilities, formatters, hooks, and small UI logic branches.
- Integration: composed components, page sections, loading/error/empty states.
- E2E: sign-in, purchase flow, protected routes, and cross-page workflows.

3. Build stable tests
- Use accessible selectors and semantic queries.
- Avoid brittle selectors tied to visual structure.
- Keep test data explicit and readable.

4. Control external dependencies
- Mock network boundaries consistently in unit/integration tests.
- Keep e2e close to production behavior with minimal mocking.
- Isolate third-party failures from core app assertions.

5. Prevent flakiness
- Remove unnecessary sleeps and timing assumptions.
- Wait on UI conditions/events, not arbitrary delays.
- Keep each test independent and reset state between runs.

6. Validate CI reliability
- Ensure tests pass in local and CI-like environments.
- Split slow suites and run critical smoke e2e on every PR.
- Track flaky tests and fix quickly instead of quarantining by default.

## Patterns

### Unit Test Patterns
- Pure function input/output assertions.
- Hook behavior with state transitions.
- Component rendering for conditional branches.
- Event handler outcomes for local UI updates.

### Integration Test Patterns
- Form validation and submission outcomes.
- Component composition and shared state interactions.
- Error/loading/success states with realistic mocked responses.
- Route-aware behavior for page-level components.

### E2E Test Patterns
- Happy path plus at least one failure path per critical flow.
- Authentication and authorization boundaries.
- Checkout/order flow and post-action confirmation states.
- Mobile viewport sanity checks for key paths.

## Quality Standards

- Tests read like user behavior documentation.
- Failures are actionable and easy to diagnose.
- Coverage prioritizes risk, not vanity percentages.
- Suites remain fast enough for daily developer use.

## Anti-Patterns to Avoid

- Over-mocking UI to the point behavior is no longer realistic.
- Snapshot-heavy suites with little behavioral assertion.
- Assertions on implementation details (internal state, private structure).
- Large e2e suites covering trivial cases better handled in lower layers.
