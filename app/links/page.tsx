import type { Metadata } from "next";
import { Suspense } from "react";
import LinksPageComponent from "@/components/links/links-page";
import { fetchLinksPageFromContentful } from "@/lib/contentful-links";

export const metadata: Metadata = {
  title: "WaistLess Foods | Links",
  description:
    "Official links for WaistLess Foods - book private dining, catering, classes, and more.",
};

// Revalidate every 5 minutes for Contentful-backed ISR.
export const revalidate = 300;

export default async function LinksPage() {
  const linksData = await fetchLinksPageFromContentful();
  console.log(linksData, "linksData")
  return (
    <Suspense fallback={<LinksPageComponent linksData={null} />}>
      <LinksPageComponent linksData={linksData} />
    </Suspense>
  );
}
