import type { Metadata } from "next";
import { Suspense } from "react";
import LinksPageComponent from "@/components/links/links-page";
import { fetchLinksPageFromContentful } from "@/lib/contentful-links";

export const metadata: Metadata = {
  title: "WaistLess Foods | Links",
  description:
    "Official links for WaistLess Foods - book private dining, catering, classes, and more.",
};

// Revalidate on every request to ensure Contentful updates are reflected immediately
export const revalidate = 0;

export default async function LinksPage() {
  const linksData = await fetchLinksPageFromContentful();
  console.log(linksData, "linksData")
  return (
    <Suspense fallback={<LinksPageComponent linksData={null} />}>
      <LinksPageComponent linksData={linksData} />
    </Suspense>
  );
}
