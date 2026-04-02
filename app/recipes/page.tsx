import {
  fetchRecipesPageFromContentful,
} from "@/lib/contentful-management";
import RecipesPageClient from "./recipes-page-client";

export const revalidate = 300;

export default async function Recipes() {
  const data = await fetchRecipesPageFromContentful();

  return <RecipesPageClient data={data} />;
}
