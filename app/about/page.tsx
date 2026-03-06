import {
  fetchAboutPageFromContentful,
  type AboutPageData,
} from "@/lib/contentful-management";
import AboutPageClient from "./about-page-client";

export const revalidate = 300;

// Fallback data if Contentful is not configured
const fallbackData: AboutPageData = {
  heroTitle: "Hey There!\nI'm Amber",
  heroBackgroundImagePath: "/about/chef-bg.png",
  heroParagraph1:
    "Chef Amber is the creative force behind WaistLess Foods, blending flavor, sustainability, and heart into every dish she makes.",
  heroParagraph2:
    "As a Houston-based private chef, Amber transforms everyday ingredients into soulful, nourishing meals designed to make healthy eating effortless and enjoyable.",
  contentImagePath: "/about/food-img.png",
  logoImagePath: "/logo.png",
  contentHeading: "More about waistless",
  contentParagraph1:
    "WaistLess is built on the idea that good food shouldn't come with waste—of ingredients, time, or intention.",
  contentParagraph2:
    "Chef Amber created WaistLess as a space to share recipes, techniques, and simple habits that make cooking more sustainable and more joyful.",
  contentParagraph3: "Here, we help you eat better, live brighter, and waste less.",
};

export default async function About() {
  // Fetch from Contentful (or use fallback if not configured)
  const data = (await fetchAboutPageFromContentful()) || fallbackData;

  return <AboutPageClient data={data} />;
}
