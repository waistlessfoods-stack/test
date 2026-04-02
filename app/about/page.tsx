import {
  fetchAboutPageFromContentful,
} from "@/lib/contentful-management";
import AboutPageClient from "./about-page-client";

export const revalidate = 300;

export default async function About() {
  const data = await fetchAboutPageFromContentful();

  return <AboutPageClient data={data} />;
}
