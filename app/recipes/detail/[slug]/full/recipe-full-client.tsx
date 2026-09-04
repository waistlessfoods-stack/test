"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ContentfulRichText } from "@/components/contentful-rich-text";
import type { Recipe } from "@/lib/contentful-management";
import { Printer } from "lucide-react";
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

function waitForImage(image: HTMLImageElement): Promise<void> {
  image.loading = "eager";

  if (image.complete) {
    return image.decode().catch(() => undefined);
  }

  return new Promise((resolve) => {
    const finish = () => {
      window.clearTimeout(timeoutId);
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      resolve();
    };
    const timeoutId = window.setTimeout(finish, 5000);

    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
  });
}

async function prepareRecipeForPrint(): Promise<void> {
  const images = Array.from(
    document.querySelectorAll<HTMLImageElement>(".recipe-print-page img")
  );

  await Promise.all([
    document.fonts.ready,
    ...images.map((image) => waitForImage(image)),
  ]);
}

export default function RecipeFullClient({
  recipe,
  isFreeRecipe,
}: RecipeFullClientProps) {
  const detailContent = getRecipeDetailContent(recipe);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  const handlePrint = async () => {
    if (isPreparingPrint) return;

    setIsPreparingPrint(true);
    try {
      await prepareRecipeForPrint();
      window.print();
    } finally {
      setIsPreparingPrint(false);
    }
  };

  return (
    <div className="recipe-print-page w-full min-h-screen bg-[#F4F4F4] overflow-x-hidden font-metropolis">
      <section className="recipe-print-section w-full py-10 md:py-12 lg:py-14">
        <Container className="recipe-print-container">
          <Breadcrumb className="recipe-print-controls mb-8">
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

          <div className="recipe-print-only recipe-print-heading">
            <div>
              <p className="recipe-print-brand">WaistLess Foods</p>
              <p className="recipe-print-tagline">Waste Less. Taste More.</p>
            </div>
            <p className="recipe-print-collection">Chef Amber&apos;s Recipe Collection</p>
          </div>

          <div className="recipe-print-hero relative w-full aspect-[16/8] rounded-xl overflow-hidden bg-[#E7E7E7] mb-8 md:mb-10">
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

          <div className="recipe-print-sheet mx-auto max-w-5xl bg-white rounded-xl p-5 md:p-8 lg:p-10 space-y-8 md:space-y-10">
            <div className="recipe-print-title-row flex flex-wrap items-center justify-between gap-3">
              <h1 className="recipe-print-title text-3xl md:text-4xl font-medium tracking-tight text-black">
                {recipe.title}
              </h1>
              <div className="recipe-print-controls flex flex-wrap items-center gap-3">
                <span className="px-3 py-1.5 rounded-md text-sm font-semibold bg-[#E8F5F5] text-[#00676E]">
                  {isFreeRecipe ? "Free Recipe" : "Unlocked"}
                </span>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isPreparingPrint}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#00676E] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00545A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00676E] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
                  aria-label={`Print ${recipe.title} or save it as a PDF`}
                  title="Open the print dialog, then choose Save as PDF"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  {isPreparingPrint ? "Preparing..." : "Print / Save PDF"}
                </button>
              </div>
            </div>

            <p className="recipe-print-controls -mt-5 text-sm leading-relaxed text-[#6F6F6F]">
              Use your browser&apos;s print dialog and choose <strong>Save as PDF</strong>
              {" "}to keep a personal copy.
            </p>

            {(recipe.cookTime || recipe.servingSize) && (
              <div className="recipe-print-meta flex flex-wrap gap-3">
                {recipe.cookTime && (
                  <div className="inline-flex items-center gap-3 rounded-full border border-black bg-white px-5 py-2.5">
                    <svg
                      className="h-5 w-5 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <circle cx="12" cy="12" r="9" />
                      <polyline points="12 7 12 12 15 14" />
                    </svg>
                    <span className="text-sm font-bold uppercase tracking-wide text-black">
                      Cook
                    </span>
                    <span className="text-base font-bold text-black">{recipe.cookTime}</span>
                  </div>
                )}
                {recipe.servingSize && (
                  <div className="inline-flex items-center gap-3 rounded-full border border-black bg-white px-5 py-2.5">
                    <svg
                      className="h-5 w-5 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                      <circle cx="10" cy="7" r="4" />
                    </svg>
                    <span className="text-sm font-bold uppercase tracking-wide text-black">
                      Serves
                    </span>
                    <span className="text-base font-bold text-black">{recipe.servingSize}</span>
                  </div>
                )}
              </div>
            )}

            <section className="recipe-print-description space-y-3">
              <h2 className="text-xl md:text-2xl font-semibold text-black">
                Description
              </h2>
              <p className="text-base md:text-lg leading-relaxed text-[#6F6F6F]">
                {detailContent.description}
              </p>
            </section>

            <div className="recipe-print-details-grid space-y-8 md:space-y-10">
              <section className="recipe-print-panel recipe-print-ingredients space-y-5">
                {recipe.ingredientsRichText ? (
                  <>
                    <h2 className="text-xl md:text-2xl font-semibold text-black">
                      Ingredients
                    </h2>
                    <ContentfulRichText document={recipe.ingredientsRichText} />
                  </>
                ) : (
                  <>
                    <div className="recipe-print-secondary-media relative w-full aspect-[16/7] rounded-lg overflow-hidden bg-[#EFEFEF]">
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
                  </>
                )}
              </section>

              <section className="recipe-print-panel recipe-print-tools space-y-5">
                {recipe.toolsRichText ? (
                  <>
                    <h2 className="text-xl md:text-2xl font-semibold text-black">
                      Tools
                    </h2>
                    <ContentfulRichText document={recipe.toolsRichText} />
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6 md:gap-8 items-start">
                    <div className="recipe-print-secondary-media relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#EFEFEF]">
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
                  </div>
                )}
              </section>
            </div>

            <section className="recipe-print-instructions space-y-5">
              <h2 className="text-xl md:text-2xl font-semibold text-black">
                Instructions
              </h2>
              {recipe.instructionsRichText ? (
                <ContentfulRichText document={recipe.instructionsRichText} />
              ) : (
                <div className="space-y-7">
                  {detailContent.steps.map((step) => (
                    <article key={step.title} className="space-y-3">
                      <h3 className="text-lg md:text-xl font-medium text-black">
                        {step.title}
                      </h3>
                      <p className="text-base md:text-lg leading-relaxed text-[#6F6F6F]">
                        {step.description}
                      </p>
                      <div className="recipe-print-secondary-media relative w-full aspect-[16/7] rounded-lg overflow-hidden bg-[#EFEFEF]">
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
              )}
            </section>

            <footer className="recipe-print-only recipe-print-footer">
              <p>WaistLess Foods | waistlessfoods.com</p>
              <p>For personal use only.</p>
            </footer>
          </div>
        </Container>
      </section>
    </div>
  );
}
