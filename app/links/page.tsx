import LinksPageComponent from "@/components/links/links-page";
import { fetchLinksPageFromContentful } from "@/lib/contentful-links";
import { buildMetadata } from "@/lib/seo";

// Revalidate every 5 minutes for Contentful-backed ISR.
export const revalidate = 300;

export async function generateMetadata() {
  const data = await fetchLinksPageFromContentful();

  return buildMetadata({
    title: "Links",
    description:
      data.profileDescription ||
      "Official links for WaistLess Foods - book private dining, catering, classes, and more.",
    path: "/links",
    image: data.profileImageUrl,
  });
}

export default async function LinksPage() {
  const linksData = await fetchLinksPageFromContentful();

  return <LinksPageComponent linksData={linksData} />;
}
