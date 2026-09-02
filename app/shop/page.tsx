import {
  fetchShopPageFromContentful,
  isCookingClassProduct,
} from "@/lib/contentful-management";
import { arePublicCookingClassesEnabled } from "@/lib/public-cooking-classes";
import { buildMetadata } from "@/lib/seo";
import ShopPageClient from "./shop-page-client";

export const revalidate = 300;

type ShopPageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

export async function generateMetadata() {
  const data = await fetchShopPageFromContentful();

  return buildMetadata({
    title: data.bannerTitle || "Shop",
    description: data.bannerDescription,
    path: "/shop",
    image: data.bannerImagePath || data.bannerFeaturedImage1Path || data.bannerFeaturedImage2Path,
  });
}

export default async function Shop({ searchParams }: ShopPageProps) {
  const data = await fetchShopPageFromContentful();
  const visibleData = arePublicCookingClassesEnabled()
    ? data
    : {
        ...data,
        recipes: data.recipes.filter(
          (recipe) => !isCookingClassProduct(recipe)
        ),
      };
  const resolvedSearchParams = await searchParams;
  const initialCategory = Array.isArray(resolvedSearchParams.category)
    ? resolvedSearchParams.category[0]
    : resolvedSearchParams.category;

  return <ShopPageClient data={visibleData} initialCategory={initialCategory} />;
}
