import {
  fetchRecipesPageFromContentful,
} from "@/lib/contentful-management";
import { buildMetadata } from "@/lib/seo";
import RecipesPageClient from "./recipes-page-client";

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
  }>;
}) {
  const data = await fetchRecipesPageFromContentful();
  const { category } = await searchParams;

  return buildMetadata({
    title: data.bannerTitle || "Recipes",
    description: data.bannerDescription,
    path: "/recipes",
    image: data.bannerImagePath || data.bannerFeaturedImage1Path || data.bannerFeaturedImage2Path,
    noIndex: Boolean(category),
  });
}

type RecipesPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function Recipes({ searchParams }: RecipesPageProps) {
  const data = await fetchRecipesPageFromContentful();
  const { category } = await searchParams;

  return <RecipesPageClient data={data} initialCategorySlug={category} />;
}
