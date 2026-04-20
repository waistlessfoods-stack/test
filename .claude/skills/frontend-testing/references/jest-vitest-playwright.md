# Jest, Vitest, and Playwright Examples

Use this companion reference when users ask for concrete test setup or starter test patterns.

## Choose the Right Stack

- Pick Vitest when the project is Vite-first or already uses Vitest.
- Pick Jest when the repository already has Jest conventions, snapshots, or custom runners.
- Pick Playwright for critical user journeys and cross-page confidence.

## Vitest + Testing Library (React)

### Example Setup

```ts
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
```

```ts
// vite.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
```

### Example Component Test

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NewsletterForm } from "./newsletter-form";

describe("NewsletterForm", () => {
  it("submits email and shows success message", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(<NewsletterForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), "chef@example.com");
    await user.click(screen.getByRole("button", { name: /subscribe/i }));

    expect(onSubmit).toHaveBeenCalledWith("chef@example.com");
    expect(
      await screen.findByText(/thank you for subscribing/i)
    ).toBeInTheDocument();
  });
});
```

## Jest + Testing Library (React)

### Example Setup

```ts
// jest.setup.ts
import "@testing-library/jest-dom";
```

```js
// jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
```

### Example Integration Test

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutPanel } from "./checkout-panel";

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

test("shows server validation message on failed checkout", async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: "Card declined" }),
  });

  const user = userEvent.setup();
  render(<CheckoutPanel />);

  await user.click(screen.getByRole("button", { name: /checkout/i }));

  await waitFor(() => {
    expect(screen.getByText(/card declined/i)).toBeInTheDocument();
  });
});
```

## Playwright E2E Patterns

### Example Config Snippet

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 14"] } },
  ],
});
```

### Example Critical Flow Test

```ts
import { expect, test } from "@playwright/test";

test("guest user is redirected to sign-in when checking out", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("button", { name: /cart/i }).click();
  await page.getByRole("button", { name: /checkout/i }).click();

  await expect(page).toHaveURL(/\/signin/);
  await expect(page.getByText(/please sign in/i)).toBeVisible();
});
```

### Example API Mock for Stability

```ts
import { test } from "@playwright/test";

test("orders page shows empty state", async ({ page }) => {
  await page.route("**/api/orders", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ orders: [] }),
    });
  });

  await page.goto("/orders");
  await page.getByRole("heading", { name: /order history/i }).waitFor();
});
```

## Reliability Checklist

- Prefer role and label based selectors over brittle CSS selectors.
- Avoid fixed waits; wait for explicit UI conditions.
- Keep tests independent; never depend on previous test data.
- Reset or isolate network mocks per test.
- Cover one happy path and one failure path for each critical user journey.
