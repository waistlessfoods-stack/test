import { Container } from "@/components/ui/container";
import Link from "next/link";
import { fetchRecipesPageFromContentful } from "@/lib/contentful-management";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import RecipeFullClient from "./recipe-full-client";

export const revalidate = 300;

type RecipeFullPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function isFreeRecipe(price: string): boolean {
  const normalized = price.trim().toLowerCase();
  if (!normalized || normalized === "free") {
    return true;
  }

  const numericPrice = parseFloat(normalized.replace(/[^0-9.-]+/g, ""));
  return !Number.isNaN(numericPrice) && numericPrice <= 0;
}

function hasRecipeInOrderItems(
  items: unknown,
  recipeId: string,
  recipeTitle: string
): boolean {
  if (!Array.isArray(items)) {
    return false;
  }

  return items.some((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const maybeItem = item as { id?: unknown; name?: unknown };
    const idMatches = typeof maybeItem.id === "string" && maybeItem.id === recipeId;
    const titleMatches =
      typeof maybeItem.name === "string" &&
      maybeItem.name.trim().toLowerCase() === recipeTitle.trim().toLowerCase();

    return idMatches || titleMatches;
  });
}

function isTransientDbError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("etimedout") ||
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("connection reset")
  );
}

async function withDbRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === maxAttempts - 1) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }

  throw lastError;
}

export default async function RecipeFullPage({ params }: RecipeFullPageProps) {
  const { slug } = await params;
  const { userId } = await auth();

  const data = await fetchRecipesPageFromContentful();
  const recipe = data.recipes.find((r) => r.slug === slug);

  if (!recipe) {
    return (
      <div className="w-full min-h-screen bg-white overflow-x-hidden font-metropolis">
        <section className="w-full py-16 2xl:py-12">
          <Container>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-black mb-4">Recipe not found</h1>
              <Link href="/recipes" className="text-[#0F8DAB] underline">
                Back to recipes
              </Link>
            </div>
          </Container>
        </section>
      </div>
    );
  }

  const recipeIsFree = isFreeRecipe(recipe.price);
  let canAccessFullContent = recipeIsFree;

  if (!canAccessFullContent && userId) {
    try {
      const completedOrders = await withDbRetry(() =>
        db
          .select({ items: orders.items })
          .from(orders)
          .where(and(eq(orders.userId, userId), eq(orders.status, "completed")))
      );

      canAccessFullContent = completedOrders.some((order) =>
        hasRecipeInOrderItems(order.items, recipe.id, recipe.title)
      );
    } catch (error) {
      console.error("Failed to check completed orders for recipe access:", error);
      canAccessFullContent = false;
    }
  }

  if (!canAccessFullContent) {
    redirect(`/recipes/detail/${slug}`);
  }

  return <RecipeFullClient recipe={recipe} isFreeRecipe={recipeIsFree} />;
}
