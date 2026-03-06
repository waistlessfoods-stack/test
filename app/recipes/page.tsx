import {
  fetchRecipesPageFromContentful,
  type RecipesPageData,
} from "@/lib/contentful-management";
import RecipesPageClient from "./recipes-page-client";

// Fallback data if Contentful is not configured
const fallbackData: RecipesPageData = {
  bannerImagePath: "/recipes/banner-recipes.png",
  bannerTitle: "Wholesome Recipes for Every Mood",
  bannerDescription:
    "From quick bites to hearty meals, explore dishes made with simple ingredients, bold flavors, and mindful cooking.",
  bannerFeaturedImage1Path: "/recipes/mango.png",
  bannerFeaturedImage2Path: "/recipes/cake.png",
  categories: [
    { id: "1", name: "BEEF", imagePath: "/recipes/beef.png", sortOrder: 1 },
    { id: "2", name: "FISH & SEAFOOD", imagePath: "/recipes/fish-seafood.png", sortOrder: 2 },
    { id: "3", name: "PASTA", imagePath: "/recipes/pasta.png", sortOrder: 3 },
    { id: "4", name: "HEALTHY MEALS", imagePath: "/recipes/meals.png", sortOrder: 4 },
    { id: "5", name: "DESSERT", imagePath: "/recipes/donuts.png", sortOrder: 5 },
    { id: "6", name: "VEGAN", imagePath: "/recipes/potato.png", sortOrder: 6 },
    { id: "7", name: "BREAKFAST", imagePath: "/recipes/mango.png", sortOrder: 7 },
  ],
  recipes: [
    {
      id: "1",
      title: "Apple Peanut Donut Bites",
      price: "$12",
      description:
        "Crisp apple rings layered with peanut butter, topped with almonds and choco chips",
      imagePath: "/recipes/donuts.png",
      sortOrder: 1,
    },
    {
      id: "2",
      title: "Almond Fudge Brownie",
      price: "Free",
      description:
        "Rich, fudgy chocolate brownie topped with crunchy almond slices indulgent,",
      imagePath: "/recipes/cake.png",
      sortOrder: 2,
    },
    {
      id: "3",
      title: "Creamy Tuna Roll",
      price: "$12",
      description:
        "Soft roll filled with creamy tuna salad and fresh veggies, served with crispy chips.",
      imagePath: "/recipes/creamy.png",
      sortOrder: 3,
    },
    {
      id: "4",
      title: "Mango Mint Chia Parfait",
      price: "$12",
      description:
        "Tropical layers of chia pudding, mango puree, and fresh mint - perfect morning boost.",
      imagePath: "/recipes/mango.png",
      sortOrder: 4,
    },
    {
      id: "5",
      title: "Herby Pasta Primavera",
      price: "$12",
      description:
        "Colorful, cozy, and bursting with fresh veggies and herbs - your go-to dinner.",
      imagePath: "/recipes/herby-pasta.png",
      sortOrder: 5,
    },
    {
      id: "6",
      title: "Sweet Potato & Chickpea",
      price: "$12",
      description:
        "Power-packed with protein and fiber. A hearty vegan bowl with roasted sweet potatoes.",
      imagePath: "/recipes/potato.png",
      sortOrder: 6,
    },
  ],
};

export default async function Recipes() {
  // Fetch from Contentful (or use fallback if not configured)
  const data = (await fetchRecipesPageFromContentful()) || fallbackData;

  return <RecipesPageClient data={data} />;
}
