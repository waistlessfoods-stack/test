import { Container } from "@/components/ui/container";
import Link from "next/link";
import {
  fetchRecipesPageFromContentful,
} from "@/lib/contentful-management";
import { redirect } from "next/navigation";
import RecipeDetailClient from "./recipe-detail-client";

export const revalidate = 300;

type RecipeDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const data = await fetchRecipesPageFromContentful();

  return data.recipes.map((recipe) => ({
    slug: recipe.slug,
  }));
}

function isFreeRecipe(price: string): boolean {
  const normalized = price.trim().toLowerCase();
  if (!normalized || normalized === "free") {
    return true;
  }

  const numericPrice = parseFloat(normalized.replace(/[^0-9.-]+/g, ""));
  return !Number.isNaN(numericPrice) && numericPrice <= 0;
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { slug } = await params;

  // Fetch all recipes data
  const data = await fetchRecipesPageFromContentful();

  // Find the specific recipe by slug
  const recipe = data.recipes.find((r) => r.slug === slug);

  if (!recipe) {
    return (
      <div className="w-full min-h-screen bg-white overflow-x-hidden font-metropolis">
        <section className="w-full py-16 2xl:py-12">
          <Container>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-black mb-4">
                Recipe not found
              </h1>
              <Link href="/recipes" className="text-[#0F8DAB] underline">
                Back to recipes
              </Link>
            </div>
          </Container>
        </section>
      </div>
    );
  }

  if (isFreeRecipe(recipe.price)) {
    redirect(`/recipes/detail/${slug}/full`);
  }

  return <RecipeDetailClient recipe={recipe} />;
}
