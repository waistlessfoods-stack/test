import {
  fetchHomepageFromContentful,
} from "@/lib/contentful-management";
import JsonLd from "@/components/seo/json-ld";
import { buildMetadata, toAbsoluteUrl } from "@/lib/seo";
import HomepageClient from "./homepage-client";

export const revalidate = 300;

export async function generateMetadata() {
  const data = await fetchHomepageFromContentful();

  return buildMetadata({
    title: "Waste Less. Taste More.",
    description: data.heroSubtitle || data.featuresIntro,
    path: "/",
    image: data.heroImagePath || data.aboutImagePath,
  });
}

export default async function Home() {
  const data = await fetchHomepageFromContentful();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WaistLess Foods",
    url: toAbsoluteUrl("/"),
    logo: toAbsoluteUrl("/logo.png"),
    description: data.heroSubtitle || data.featuresIntro,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <HomepageClient data={data} />
    </>
  );
}
