import {
  fetchHomepageFromContentful,
  type HomepageData,
} from "@/lib/contentful-management";
import HomepageClient from "./homepage-client";

export const revalidate = 300;

export default async function Home() {
  const data = await fetchHomepageFromContentful();

  return <HomepageClient data={data} />;
}
