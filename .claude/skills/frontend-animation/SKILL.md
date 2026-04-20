---
name: frontend-animation
description: Build polished frontend animations with clear hierarchy and performance-first patterns. Use when users ask for motion design, transitions, scroll reveals, micro-interactions, or animated UI states in web apps.
---

Create production-ready motion systems that feel intentional, fast, and accessible.

## Workflow

1. Define intent first
- Identify which moments should move: page entry, section reveal, hover/focus, route transitions, loading states.
- Keep motion meaningful. Avoid animating everything.

2. Choose implementation strategy
- Prefer CSS transitions/keyframes for simple UI states.
- Use framework motion libs only when choreography or gesture complexity is required.
- Respect existing stack and styling conventions.

3. Performance guardrails
- Favor transform and opacity over layout-affecting properties.
- Avoid animating expensive properties like width/height/top/left where possible.
- Keep durations tight and consistent.

4. Accessibility defaults
- Support prefers-reduced-motion and provide reduced or static alternatives.
- Preserve focus visibility and keyboard interactions while animating.
- Do not hide critical information behind motion-only cues.

## Motion Patterns

- Entry: fade + slight translate with short stagger for grouped items.
- Hover: subtle scale/translate and color shift, never jittery loops.
- State changes: animate between component states with consistent easing.
- Feedback: quick, confident success/error transitions.

## Recommended Ranges

- Micro interactions: 120-180ms
- Standard transitions: 180-280ms
- Complex entrances: 300-500ms max
- Easing: ease-out for entry, ease-in for exit, avoid heavy bounce by default

## Quality Checks

- Feels responsive at 60fps on common devices.
- Reduced-motion mode is usable and clean.
- Motion reinforces hierarchy instead of distracting from content.
