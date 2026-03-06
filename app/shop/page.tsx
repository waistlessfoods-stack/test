import {
  fetchRecipesPageFromContentful,
  type RecipesPageData,
} from "@/lib/contentful-management";
import ShopPageClient from "./shop-page-client";

export const revalidate = 300;

export default async function Shop() {
  // Fetch from Contentful (or use fallback if not configured)
  const data = await fetchRecipesPageFromContentful();

  if (!data) {
    return <div>Failed to load shop</div>;
  }

  return <ShopPageClient data={data} />;
}
