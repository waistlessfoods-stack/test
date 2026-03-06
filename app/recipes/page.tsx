import {
  fetchRecipesPageFromContentful,
  type RecipesPageData,
} from "@/lib/contentful-management";
import RecipesPageClient from "./recipes-page-client";

export const revalidate = 300;

export default async function Recipes() {
  // Fetch from Contentful (or use fallback if not configured)
  const data = await fetchRecipesPageFromContentful();

  if (!data) {
    return <div>Failed to load recipes</div>;
  }

  return <RecipesPageClient data={data} />;
}
