import type { Recipe } from "@/lib/contentful-management";

// Public cards and purchase previews need marketing fields only. Never serialize
// protected ingredients/instructions into client props behind a visual paywall.
export function recipePurchasePreview(recipe: Recipe): Recipe {
  return {
    id: recipe.id, slug: recipe.slug, legacyTitleSlug: recipe.legacyTitleSlug,
    title: recipe.title, price: recipe.price, description: recipe.description,
    imagePath: recipe.imagePath, sortOrder: recipe.sortOrder,
    categoryIds: recipe.categoryIds, categoryId: recipe.categoryId, categoryNames: recipe.categoryNames,
    productKind: recipe.productKind, capacity: recipe.capacity, eventDate: recipe.eventDate,
    duration: recipe.duration, featured: recipe.featured, detailDescription: recipe.detailDescription,
    heroImagePath: recipe.heroImagePath, cookTime: recipe.cookTime, servingSize: recipe.servingSize,
  };
}
