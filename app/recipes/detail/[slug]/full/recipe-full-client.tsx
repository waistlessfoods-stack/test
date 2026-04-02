"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import type { Recipe } from "@/lib/contentful-management";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type RecipeFullClientProps = {
  recipe: Recipe;
  isFreeRecipe: boolean;
};

type RecipeStep = {
  title: string;
  description: string;
  imagePath: string | null;
  imageAlt: string;
};

function getRecipeDetailContent(recipe: Recipe) {
  const steps: RecipeStep[] = (recipe.instructionSteps || [])
    .map((step, index) => ({
      title: step.title || `Step ${index + 1}`,
      description: step.description,
      imagePath: step.imagePath || recipe.imagePath,
      imageAlt: `${recipe.title} ${step.title || `step ${index + 1}`}`,
    }))
    .filter((step) => Boolean(step.title || step.description));

  return {
    description: recipe.detailDescription || recipe.description,
    ingredients: recipe.ingredients || [],
    tools: recipe.tools || [],
    heroImagePath: recipe.heroImagePath || recipe.imagePath,
    ingredientsImagePath: recipe.ingredientsImagePath || recipe.imagePath,
    toolsImagePath: recipe.toolsImagePath || recipe.imagePath,
    steps,
  };
}

export default function RecipeFullClient({
  recipe,
  isFreeRecipe,
}: RecipeFullClientProps) {
  const detailContent = getRecipeDetailContent(recipe);

  return (
    <div className="w-full min-h-screen bg-[#F4F4F4] overflow-x-hidden font-metropolis">
      <section className="w-full py-10 md:py-12 lg:py-14">
        <Container>
          <Breadcrumb className="mb-8">
            <BreadcrumbList className="text-base md:text-lg font-medium text-black">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/recipes">Recipes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/recipes/detail/${recipe.slug}`}>Detail recipes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Full recipe</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="relative w-full aspect-[16/8] rounded-xl overflow-hidden bg-[#E7E7E7] mb-8 md:mb-10">
            {detailContent.heroImagePath && (
              <Image
                src={detailContent.heroImagePath}
                alt={recipe.title}
                fill
                className="object-cover"
                priority
              />
            )}
          </div>

          <div className="mx-auto max-w-5xl bg-white rounded-xl p-5 md:p-8 lg:p-10 space-y-8 md:space-y-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-black">
                {recipe.title}
              </h1>
              <span className="px-3 py-1.5 rounded-md text-sm font-semibold bg-[#E8F5F5] text-[#00676E]">
                {isFreeRecipe ? "Free Recipe" : "Unlocked"}
              </span>
            </div>

            <section className="space-y-3">
              <h2 className="text-xl md:text-2xl font-semibold text-black">
                Description
              </h2>
              <p className="text-base md:text-lg leading-relaxed text-[#6F6F6F]">
                {detailContent.description}
              </p>
            </section>

            <section className="space-y-5">
              <div className="relative w-full aspect-[16/7] rounded-lg overflow-hidden bg-[#EFEFEF]">
                {detailContent.ingredientsImagePath && (
                  <Image
                    src={detailContent.ingredientsImagePath}
                    alt={`${recipe.title} ingredients`}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="space-y-3">
                <h2 className="text-xl md:text-2xl font-semibold text-black">
                  Ingredients
                </h2>
                <ul className="space-y-2 text-base md:text-lg text-[#1F1F1F]">
                  {detailContent.ingredients.map((item) => (
                    <li key={item} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6 md:gap-8 items-start">
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#EFEFEF]">
                {detailContent.toolsImagePath && (
                  <Image
                    src={detailContent.toolsImagePath}
                    alt={`${recipe.title} tools`}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="space-y-3">
                <h2 className="text-xl md:text-2xl font-semibold text-black">
                  Tools
                </h2>
                <ul className="space-y-2 text-base md:text-lg text-[#1F1F1F]">
                  {detailContent.tools.map((item) => (
                    <li key={item} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="space-y-5">
              <h2 className="text-xl md:text-2xl font-semibold text-black">
                Instructions
              </h2>
              <div className="space-y-7">
                {detailContent.steps.map((step) => (
                  <article key={step.title} className="space-y-3">
                    <h3 className="text-lg md:text-xl font-medium text-black">
                      {step.title}
                    </h3>
                    <p className="text-base md:text-lg leading-relaxed text-[#6F6F6F]">
                      {step.description}
                    </p>
                    <div className="relative w-full aspect-[16/7] rounded-lg overflow-hidden bg-[#EFEFEF]">
                      {step.imagePath && (
                        <Image
                          src={step.imagePath}
                          alt={step.imageAlt}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </Container>
      </section>
    </div>
  );
}
