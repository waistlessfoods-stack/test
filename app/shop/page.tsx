import {
  fetchShopPageFromContentful,
  type ShopPageData,
} from "@/lib/contentful-management";
import ShopPageClient from "./shop-page-client";

export const revalidate = 300;

export default async function Shop() {
  // Fetch from Contentful (or use fallback if not configured)
  const data = await fetchShopPageFromContentful();

  if (!data) {
    console.error("[Shop Page] Failed to fetch shop page data from Contentful");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Failed to load shop</h1>
          <p className="text-gray-600">Please check Contentful configuration and ensure the shopPage content type exists.</p>
        </div>
      </div>
    );
  }

  return <ShopPageClient data={data} />;
}
