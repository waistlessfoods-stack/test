import { Container } from "@/components/ui/container";
import Link from "next/link";
import {
  fetchRecipesPageFromContentful,
} from "@/lib/contentful-management";
import RecipeDetailClient from "./recipe-detail-client";

export const revalidate = 300;

type RecipeDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const data = await fetchRecipesPageFromContentful();
  
  if (!data?.recipes) {
    return [];
  }

  return data.recipes.map((recipe) => ({
    slug: recipe.slug,
  }));
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { slug } = await params;

  console.log("Looking for recipe with slug:", slug);

  // Fetch all recipes data
  const data = await fetchRecipesPageFromContentful();

  console.log("Available recipes:", data?.recipes.map(r => ({ title: r.title, slug: r.slug })));

  // Find the specific recipe by slug
  const recipe = data?.recipes.find((r) => r.slug === slug);

  console.log("Found recipe:", recipe ? recipe.title : "not found");

  if (!recipe || !data) {
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

  return <RecipeDetailClient recipe={recipe} />;
}
