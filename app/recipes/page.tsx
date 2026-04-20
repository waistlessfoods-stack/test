import {
  fetchRecipesPageFromContentful,
} from "@/lib/contentful-management";
import RecipesPageClient from "./recipes-page-client";

export const revalidate = 300;

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
