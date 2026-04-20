---
name: frontend-accessibility
description: Design and implement accessible frontend interfaces. Use when users ask for a11y improvements, keyboard navigation, semantic HTML, ARIA usage, focus management, contrast fixes, or screen-reader support.
---

Deliver UI that works for keyboard, screen reader, low-vision, and motion-sensitive users by default.

## Workflow

1. Structure and semantics
- Use semantic HTML first (button, nav, main, form, label, table, etc.).
- Add ARIA only when native semantics are insufficient.

2. Keyboard usability
- Ensure all interactive controls are reachable and operable by keyboard.
- Preserve logical tab order and visible focus indicators.
- Support Escape/Enter/Space behaviors for overlays and custom widgets.

3. Screen reader clarity
- Provide meaningful names for controls and landmarks.
- Use labels, descriptions, and status announcements for dynamic updates.
- Hide decorative content from assistive tech when appropriate.

4. Visual accessibility
- Maintain sufficient contrast for text and UI controls.
- Avoid color-only meaning; include text/icon/state cues.
- Ensure zoom and reflow do not break core functionality.

5. Motion and timing
- Respect prefers-reduced-motion.
- Avoid auto-advancing UI that cannot be paused/stopped.

## Implementation Defaults

- Buttons for actions, links for navigation.
- Inputs connected to labels and errors linked via aria-describedby.
- Dialogs trap focus, restore focus on close, and announce context.
- Toasts/async feedback exposed via polite or assertive live regions as needed.

## Quality Checks

- Full keyboard path works end-to-end.
- Focus is always visible and never lost.
- Screen reader output is concise and understandable.
- Accessibility improvements do not regress visual design quality.
