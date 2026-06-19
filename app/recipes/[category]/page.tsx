import { redirect } from "next/navigation";

type RecipesPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function RecipesPage({ params }: RecipesPageProps) {
  const { category } = await params;
  redirect(`/recipes?category=${encodeURIComponent(category)}`);
}
