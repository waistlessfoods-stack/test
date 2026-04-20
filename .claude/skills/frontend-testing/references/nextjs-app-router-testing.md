# Next.js Testing Examples (App Router, Server Components, Route Handlers)

Use this reference when users ask for concrete Next.js testing patterns in App Router projects.

## Scope Guidance

- Test UI behavior at the boundary users can observe.
- Keep server component tests focused on rendered output and data dependencies.
- Test route handlers as HTTP contracts (status, JSON shape, auth behavior).

## App Router Component Testing

### Client Component Example (Vitest + Testing Library)

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from "./search-bar";

describe("SearchBar", () => {
  it("calls onSearch with typed value", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole("textbox", { name: /search/i }), "pasta");
    await user.click(screen.getByRole("button", { name: /find/i }));

    expect(onSearch).toHaveBeenCalledWith("pasta");
  });
});
```

### Client Component Example (Jest + Testing Library)

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterChips } from "./filter-chips";

test("toggles selected chip", async () => {
  const onChange = jest.fn();
  const user = userEvent.setup();

  render(<FilterChips values={["Vegan", "Dessert"]} onChange={onChange} />);

  await user.click(screen.getByRole("button", { name: "Vegan" }));

  expect(onChange).toHaveBeenCalledWith(["Vegan"]);
});
```

## Server Component Patterns

Because Server Components run on the server, prefer testing through:
- integration at page/route boundary
- behavior assertions on rendered output
- mocked data layer or deterministic fixtures

### Example Page-Level Integration (Route Render Contract)

```tsx
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import RecipesPage from "@/app/recipes/page";

vi.mock("@/lib/contentful-management", () => ({
  fetchRecipesPageFromContentful: vi.fn().mockResolvedValue({
    heroTitle: "Recipes",
    recipes: [{ id: "1", title: "Creamy Tuna Roll" }],
  }),
}));

it("renders recipes from server data", async () => {
  const ui = await RecipesPage();
  render(ui);

  expect(screen.getByText("Recipes")).toBeInTheDocument();
  expect(screen.getByText("Creamy Tuna Roll")).toBeInTheDocument();
});
```

## Route Handler Testing (App Router API)

Route handlers in App Router are tested by invoking exported HTTP methods.

### Example GET Handler Test

```ts
import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/orders/route";

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ orderBy: async () => [] }),
      }),
    }),
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_123" }),
}));

describe("GET /api/orders", () => {
  it("returns 200 with orders array", async () => {
    const response = await GET(new Request("http://localhost/api/orders"));
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(Array.isArray(payload.orders)).toBe(true);
  });
});
```

### Example Unauthorized Contract

```ts
import { expect, it, vi } from "vitest";
import { GET } from "@/app/api/orders/route";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }),
}));

it("returns 401 when user is not authenticated", async () => {
  const response = await GET(new Request("http://localhost/api/orders"));
  expect(response.status).toBe(401);
});
```

## Playwright E2E for App Router

### Protected Route Redirect

```ts
import { expect, test } from "@playwright/test";

test("redirects guest from orders page to sign-in", async ({ page }) => {
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/signin/);
});
```

### App Router Navigation State

```ts
import { expect, test } from "@playwright/test";

test("navigates from shop to recipe detail", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("link", { name: /creamy tuna roll/i }).click();
  await expect(page).toHaveURL(/\/recipes\/detail\//);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
```

## Reliability Notes

- Avoid asserting on private implementation details of server components.
- Keep route handler tests focused on HTTP contract and business branches.
- In e2e, assert user-visible outcomes and URLs, not internal framework behavior.
- Prefer deterministic fixtures for server data to keep tests stable.
