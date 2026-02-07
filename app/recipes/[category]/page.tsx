type RecipesPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function RecipesPage({ params }: RecipesPageProps) {
  const { category } = await params;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold capitalize">{category} Recipes</h1>
    </div>
  );
}
