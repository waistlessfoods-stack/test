import {
  fetchAboutPageFromContentful,
} from "@/lib/contentful-management";
import { buildMetadata } from "@/lib/seo";
import AboutPageClient from "./about-page-client";

export const revalidate = 300;

export async function generateMetadata() {
  const data = await fetchAboutPageFromContentful();

  return buildMetadata({
    title: "About",
    description: data.heroParagraph1 || data.contentParagraph1,
    path: "/about",
    image: data.heroBackgroundImagePath || data.contentImagePath || data.logoImagePath,
  });
}

export default async function About() {
  const data = await fetchAboutPageFromContentful();

  return <AboutPageClient data={data} />;
}
