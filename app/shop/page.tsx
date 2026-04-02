import {
  fetchShopPageFromContentful,
} from "@/lib/contentful-management";
import ShopPageClient from "./shop-page-client";

export const revalidate = 300;

export default async function Shop() {
  const data = await fetchShopPageFromContentful();

  return <ShopPageClient data={data} />;
}
