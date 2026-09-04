import type { Metadata } from "next";
import JsonLd from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import Link from "next/link";
import {
  findRecipeBySlug,
  fetchRecipesPageFromContentful,
  getRecipeOnlyPageData,
  isCookingClassProduct,
} from "@/lib/contentful-management";
import { redirect } from "next/navigation";
import { buildMetadata, toAbsoluteUrl } from "@/lib/seo";
import RecipeDetailClient from "./recipe-detail-client";

export const revalidate = 300;

type RecipeDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const data = getRecipeOnlyPageData(await fetchRecipesPageFromContentful());

  return data.recipes.flatMap((recipe) =>
    [recipe.slug, recipe.legacyTitleSlug]
      .filter((value): value is string => Boolean(value))
      .map((slug) => ({ slug }))
  );
}

function isFreeRecipe(price: string): boolean {
  const normalized = price.trim().toLowerCase();
  if (!normalized || normalized === "free") {
    return true;
  }

  const numericPrice = parseFloat(normalized.replace(/[^0-9.-]+/g, ""));
  return !Number.isNaN(numericPrice) && numericPrice <= 0;
}

export async function generateMetadata({
  params,
}: RecipeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchRecipesPageFromContentful();
  const recipe = findRecipeBySlug(data.recipes, slug);

  if (!recipe) {
    return buildMetadata({
      title: "Recipe Not Found",
      description: "This recipe could not be found.",
      path: `/recipes/detail/${slug}`,
      noIndex: true,
    });
  }

  const targetPath = isFreeRecipe(recipe.price)
    ? `/recipes/detail/${recipe.slug}/full`
    : `/recipes/detail/${recipe.slug}`;

  return buildMetadata({
    title: recipe.title,
    description: recipe.detailDescription || recipe.description,
    path: targetPath,
    image: recipe.heroImagePath || recipe.imagePath,
  });
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { slug } = await params;

  // Fetch all recipes data
  const data = await fetchRecipesPageFromContentful();

  // Find the specific recipe by slug
  const recipe = findRecipeBySlug(data.recipes, slug);

  if (!recipe) {
    return (
      <div className="w-full bg-white overflow-x-hidden font-metropolis">
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

  if (isCookingClassProduct(recipe)) {
    redirect(`/shop/${recipe.slug}`);
  }

  if (recipe.slug !== slug) {
    redirect(`/recipes/detail/${recipe.slug}`);
  }

  if (isFreeRecipe(recipe.price)) {
    redirect(`/recipes/detail/${recipe.slug}/full`);
  }

  const recipeUrl = toAbsoluteUrl(`/recipes/detail/${recipe.slug}`);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Recipe",
      name: recipe.title,
      description: recipe.detailDescription || recipe.description,
      image: recipe.heroImagePath || recipe.imagePath || undefined,
      url: recipeUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: toAbsoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Recipes",
          item: toAbsoluteUrl("/recipes"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: recipe.title,
          item: recipeUrl,
        },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <RecipeDetailClient recipe={recipe} />
    </>
  );
}
