---
name: frontend-tailwind
description: Implement clean, scalable frontend UI using Tailwind CSS. Use when users ask for Tailwind components, layout systems, responsive design, utility-class refactors, or design-token alignment.
---

Build maintainable Tailwind UI that is expressive without becoming utility noise.

## Workflow

1. Read context first
- Reuse existing spacing scale, colors, typography, and radius/shadow patterns.
- Follow established component structure before introducing new conventions.

2. Compose classes intentionally
- Group classes by purpose: layout, spacing, typography, color, effects, states.
- Keep class strings readable and stable.
- Prefer reusable component wrappers for repeated class stacks.

3. Responsive strategy
- Start mobile-first, then add breakpoint overrides.
- Use fluid patterns where possible (grids/flex constraints) before hard pixel locking.

4. State and interaction
- Cover hover/focus/active/disabled/loading states.
- Ensure focus-visible styles are clear and accessible.

5. Theming and consistency
- Prefer tokens and CSS variables already used in the project.
- Avoid introducing one-off colors/sizes unless necessary.

## Tailwind Best Practices

- Prefer semantic composition in components over giant inline one-off blocks.
- Use utility classes for speed, extract repeated patterns when duplication grows.
- Keep z-index, shadows, and blur effects restrained and purposeful.
- Validate dark/light mode behavior if the app supports themes.

## Quality Checks

- No accidental layout shifts across breakpoints.
- Class names remain understandable to maintainers.
- Components are consistent with existing design language.
