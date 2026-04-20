---
name: frontend-performance
description: Optimize frontend performance across loading, rendering, runtime, and bundle delivery. Use when users ask to improve Core Web Vitals, reduce bundle size, speed up page load, fix jank, or profile React/Next.js UI bottlenecks.
---

Build measurable performance improvements that preserve UX quality and maintainability.

## Workflow

1. Baseline first
- Identify current bottleneck with concrete metrics before changing code.
- Prioritize user-centric outcomes: LCP, INP, CLS, TTFB, and time-to-interactive.
- Distinguish network, CPU, rendering, and JavaScript costs.

2. Attack highest-impact paths
- Focus on above-the-fold content and common user flows first.
- Optimize expensive routes/components before broad refactors.
- Avoid premature micro-optimizations without measured impact.

3. Loading and delivery
- Reduce critical path work: defer non-essential scripts and UI.
- Optimize images, fonts, and third-party resources.
- Improve caching strategy and avoid cache-busting mistakes.

4. Runtime rendering performance
- Minimize unnecessary re-renders and avoid expensive work in render.
- Split heavy components and lazy-load where appropriate.
- Keep animations/compositing GPU-friendly.

5. Bundle strategy
- Eliminate dead dependencies and heavy imports.
- Prefer code-splitting by route/feature boundaries.
- Watch for oversized shared chunks and duplicate libraries.

6. Validate and guard
- Re-measure after changes and report metric deltas.
- Ensure no regressions in accessibility, SEO, or visual stability.
- Add lightweight guardrails (budgets/checks) when possible.

## Performance Playbook

- Images: responsive sizing, modern formats, lazy-loading below the fold.
- Fonts: subset, preload key files, avoid layout-shifting swaps.
- Data fetching: reduce waterfalls, parallelize safe requests.
- React: memoize only where profiling proves benefit.
- Lists/tables: virtualize large datasets when needed.
- Interaction: keep event handlers cheap and avoid long main-thread tasks.

## Quality Checks

- Improvements are backed by before/after measurements.
- User-perceived speed is better on realistic devices/network.
- No hidden regressions in maintainability or UX.
