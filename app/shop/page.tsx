import {
  fetchShopPageFromContentful,
} from "@/lib/contentful-management";
import { buildMetadata } from "@/lib/seo";
import ShopPageClient from "./shop-page-client";

export const revalidate = 300;

export async function generateMetadata() {
  const data = await fetchShopPageFromContentful();

  return buildMetadata({
    title: data.bannerTitle || "Shop",
    description: data.bannerDescription,
    path: "/shop",
    image: data.bannerImagePath || data.bannerFeaturedImage1Path || data.bannerFeaturedImage2Path,
  });
}

export default async function Shop() {
  const data = await fetchShopPageFromContentful();

  return <ShopPageClient data={data} />;
}
