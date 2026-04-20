---
name: component-architecture
description: Design scalable frontend component architecture for React/Next.js and similar UI systems. Use when users ask for component refactors, design-system alignment, prop/API cleanup, state boundaries, composition patterns, or folder structure improvements.
---

Create component systems that are modular, predictable, and easy to evolve.

## Workflow

1. Map current structure
- Identify presentational vs container responsibilities.
- Locate duplicated UI logic and inconsistent component APIs.
- Document state ownership and data flow across the feature.

2. Define boundaries
- Keep components single-purpose with explicit contracts.
- Separate domain logic from visual primitives.
- Keep side effects at feature/container boundaries.

3. API design principles
- Prefer small, composable props over large config objects.
- Use clear names and stable defaults.
- Favor composition slots/children for extensibility.
- Avoid prop drilling where context or local composition is cleaner.

4. State strategy
- Keep state as local as possible, lift only when required.
- Normalize shared state access patterns across related components.
- Avoid mixing server data, derived UI state, and ephemeral interaction state.

5. Reuse and consistency
- Promote repeated patterns into reusable primitives.
- Align with design tokens and shared style conventions.
- Reduce one-off variants that increase maintenance cost.

6. Refactor safely
- Make incremental changes with clear migration paths.
- Preserve external behavior unless change is requested.
- Add or update tests/stories for critical component contracts.

## Architecture Patterns

- Primitive components: Button, Input, Card, Modal (style and semantics).
- Composite components: feature-level assembled blocks.
- Container/feature wrappers: data fetching, orchestration, side effects.
- Utility hooks: encapsulate reusable stateful logic.

## Quality Checks

- Components are easier to understand and reuse.
- Public APIs are smaller and more consistent.
- Feature changes require fewer cross-file edits.
- Architecture supports growth without heavy rewrites.
