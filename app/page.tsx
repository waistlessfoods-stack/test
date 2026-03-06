import {
  fetchHomepageFromContentful,
  type HomepageData,
} from "@/lib/contentful-management";
import HomepageClient from "./homepage-client";

export const revalidate = 300;

// Fallback data if Contentful is not configured
const fallbackData: HomepageData = {
  heroTitle: "Waste Less.\nTaste More.",
  heroSubtitle:
    "Private Chef Amber curates fresh, flavorful meals, from pescatarian feasts to hearty family dinners, with an eco-conscious touch.",
  heroImagePath: "/hero.png",
  heroPrimaryCtaLabel: "Book a Private Experience",
  heroPrimaryCtaHref: "/services",
  heroSecondaryCtaLabel: "View Services",
  heroSecondaryCtaHref: "/services",
  featuresHeading: "SIMPLE. SUSTAINABLE. DELICIOUS.",
  featuresIntro:
    "We make healthy, eco-conscious eating easy for everyone. Discover recipes and habits that taste as good as they feel.",
  features: [
    {
      id: "1",
      title: "RECIPES FOR EVERY MOOD",
      description:
        "Find delicious inspiration for every occasion — from quick bites to weekend-worthy meals.",
      imagePath: "/highlight/recipe.png",
      buttonLabel: "More Info",
      sortOrder: 1,
    },
    {
      id: "2",
      title: "ECO LIVING TIPS",
      description:
        "Learn simple, sustainable habits to make your kitchen and home more eco-friendly.",
      imagePath: "/highlight/eco-living.png",
      buttonLabel: "More Info",
      sortOrder: 2,
    },
    {
      id: "3",
      title: "MEET CHEF AMBER",
      description:
        "Discover Chef Amber's story, her cooking philosophy, and the passion behind every flavorful dish.",
      imagePath: "/highlight/meet-chef.png",
      buttonLabel: "More Info",
      sortOrder: 3,
    },
  ],
  aboutHeading: "ABOUT CHEF AMBER",
  aboutBodyPrimary:
    "Chef Amber is the creative force behind WaistLess Foods, blending flavor, sustainability, and heart into every dish she makes.",
  aboutBodySecondary:
    "As a Houston-based private chef, Amber transforms everyday ingredients into soulful, nourishing meals designed to make healthy eating effortless and enjoyable.",
  aboutBodyTertiary:
    "Her journey began cooking for her family of four — now it's her mission to show that mindful cooking can be both exciting and full of love.",
  aboutBullets: [
    "Sustainable Cooking",
    "Flavor-Driven Recipes",
    "Family-Inspired Meals",
    "Always Made with Care",
  ],
  aboutButtonLabel: "Meet Chef Amber",
  aboutButtonHref: "/about",
  aboutImagePath: "/highlight/amber-chef.png",
  featuredHeading: "Featured Recipes",
  featuredRecipes: [
    {
      id: "1",
      title: "BREAKFAST",
      slug: "breakfast",
      description:
        "Start your day with nourishing, flavor-packed dishes made from fresh, sustainable ingredients.",
      imagePath: "/featured/breakfast.png",
      sortOrder: 1,
    },
    {
      id: "2",
      title: "LUNCH",
      slug: "lunch",
      description:
        "Light yet satisfying recipes perfect for a mid-day boost wholesome, colorful, and full of life.",
      imagePath: "/featured/lunch.png",
      sortOrder: 2,
    },
    {
      id: "3",
      title: "DINNER",
      slug: "dinner",
      description:
        "End your day with hearty, soulful meals crafted to bring comfort, balance, and joy to your table.",
      imagePath: "/featured/dinner.png",
      sortOrder: 3,
    },
    {
      id: "4",
      title: "DESSERT",
      slug: "dessert",
      description:
        "Sweet creations that satisfy your cravings while keeping things natural and mindful.",
      imagePath: "/featured/dessert.png",
      sortOrder: 4,
    },
  ],
  testimonialBackgroundPath: "/testimonial.png",
  testimonials: [
    {
      id: "1",
      title: "COOKING CLASS",
      text: "\"I'm a realtor and I hired Chef Amber to help me bring a unique idea to life. A cooking class attached to a finance class. Sounds crazy but everyone loved it. They appreciated the gems she dropped, her made from scratch sauces and her personality. At one point the room filled with 20+ people was dead silent. Now you know when people are silent and they are eating that means the food is good! I can't wait to work with her again.\"",
      author: "-Lisa Barnes, J. Barnes Realty-",
      sortOrder: 1,
    },
    {
      id: "2",
      title: "PRIVATE DINING",
      text: "\"Chef Amber provided an exceptional dining experience for our anniversary. The attention to detail and the fusion of flavors was unlike anything we've had before. Highly recommend!\"",
      author: "-Michael & Sarah J.-",
      sortOrder: 2,
    },
    {
      id: "3",
      title: "MEAL PREP",
      text: "\"Her meal prep service has changed my life. Eating healthy has never been this easy and delicious. Each dish feels like it was made with so much care and soul.\"",
      author: "-David Wilson-",
      sortOrder: 3,
    },
  ],
};

export default async function Home() {
  // Fetch from Contentful (or use fallback if not configured)
  const data = (await fetchHomepageFromContentful()) || fallbackData;

  return <HomepageClient data={data} />;
}
