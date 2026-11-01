import Link from "next/link";
import { notFound } from "next/navigation";
import RecipeFullClient from "@/app/recipes/detail/[slug]/full/recipe-full-client";
import {
  fetchRecipesPageFromContentful,
  findRecipeBySlug,
  isCookingClassProduct,
} from "@/lib/contentful-management";
import { requireAdminPageSession } from "@/lib/admin-page-session";
import { contentfulEntryEditorUrl } from "@/lib/contentful-editor-links";
import RefreshRecipeContent from "@/components/admin/refresh-recipe-content";

export default async function AdminRecipePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminPageSession();

  const { slug } = await params;
  const data = await fetchRecipesPageFromContentful();
  const recipe = findRecipeBySlug(data.recipes, slug);

  if (!recipe || isCookingClassProduct(recipe)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f0f5f5]">
      <div className="recipe-print-controls bg-[#0e2f31] px-4 py-4 text-white md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Admin-only preview</p>
            <p className="text-xs text-white/70">
              This is the full post-purchase recipe layout.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
          {contentfulEntryEditorUrl(recipe.id) && <a href={contentfulEntryEditorUrl(recipe.id)!} target="_blank" rel="noopener noreferrer" className="text-sm font-medium underline underline-offset-4">Edit in Contentful ↗</a>}
          <RefreshRecipeContent />
          <Link
            href="/admin/recipes"
            className="text-sm font-medium text-white underline underline-offset-4"
          >
            Back to paid recipes
          </Link>
          </div>
        </div>
      </div>
      <RecipeFullClient recipe={recipe} isFreeRecipe={false} />
    </main>
  );
}
