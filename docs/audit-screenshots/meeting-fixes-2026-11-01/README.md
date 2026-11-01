# October meeting fixes — local browser verification

Verified November 1, 2026 against the local development server at `http://localhost:3010`.

Run: `node scripts/qa-october-meeting.mjs` with the local server running on port 3010.

The final run passed all seven grouped checks in [results.json](results.json). It read the current service content, verified exact approved form copy, exercised guest-count input values and buttons, checked computed selection/text/background styles, checked 390px layouts, confirmed the service price badges were absent, and verified the administrator account-sign-in entry.

The preview gate was unlocked only inside the test browser's session storage. No application preview setting was changed. The test submitted no forms, sent no emails, created no customer records, and made no payments.

| Inquiry | Desktop | Mobile |
| --- | --- | --- |
| Private Chef | [Screenshot](private-desktop.png) | [Screenshot](private-mobile.png) |
| Catering | [Screenshot](catering-desktop.png) | [Screenshot](catering-mobile.png) |
| Cooking Class | [Screenshot](cooking-classes-desktop.png) | [Screenshot](cooking-classes-mobile.png) |

Guest counts checked: 1, 10, 49, 50, and invalid 51. Maximum 50 remains enforced. Repeated button changes use real buttons and cannot select surrounding text; selected numeric text uses pale teal with black text.

This verifies local behavior. It does not establish production deployment, Amber's own administrator login, or real inbox/payment success.
