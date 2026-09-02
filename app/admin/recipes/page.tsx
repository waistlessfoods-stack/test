import Link from "next/link";
import {
  fetchRecipesPageFromContentful,
  isCookingClassProduct,
} from "@/lib/contentful-management";
import { requireAdminPageSession } from "@/lib/admin-page-session";

function isPaidRecipe(price: string): boolean {
  const normalized = price.trim().toLowerCase();
  if (!normalized || normalized === "free") {
    return false;
  }

  const numericPrice = Number.parseFloat(
    normalized.replace(/[^0-9.-]+/g, "")
  );
  return !Number.isNaN(numericPrice) && numericPrice > 0;
}

export default async function AdminRecipePreviewsPage() {
  await requireAdminPageSession();

  const data = await fetchRecipesPageFromContentful();
  const paidRecipes = data.recipes.filter(
    (recipe) => !isCookingClassProduct(recipe) && isPaidRecipe(recipe.price)
  );

  return (
    <main className="min-h-screen bg-[#f0f5f5] px-4 py-8 md:px-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="mb-6 inline-flex text-sm font-medium text-[#388082] hover:underline"
        >
          ← Back to Admin Portal
        </Link>
        <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Paid Recipe Previews
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Preview the complete customer layout for any paid recipe without
            placing an order. These pages remain protected by the admin session.
          </p>

          {paidRecipes.length > 0 ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {paidRecipes.map((recipe) => (
                <article
                  key={recipe.id}
                  className="rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {recipe.title}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {recipe.price}
                      </p>
                    </div>
                    <Link
                      href={`/admin/recipes/${encodeURIComponent(recipe.slug)}`}
                      className="shrink-0 rounded-lg bg-[#388082] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Preview
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-7 rounded-xl bg-gray-50 p-5 text-sm text-gray-600">
              No paid recipes are currently published in Contentful.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
