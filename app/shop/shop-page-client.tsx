"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { CarouselArrowButton } from "@/components/ui/carousel-arrow-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/auth-client";
import type { ShopPageData, RecipeCategory, Recipe } from "@/lib/contentful-management";

type ShopPageClientProps = {
  data: ShopPageData;
};

export default function ShopPageClient({ data }: ShopPageClientProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [unlockedRecipeIds, setUnlockedRecipeIds] = useState<Set<string>>(new Set());
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!api || data.categories.length <= 1) return;

    const intervalId = window.setInterval(() => {
      api.scrollNext();
    }, 3500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [api, data.categories.length]);

  useEffect(() => {
    if (isPending) return;

    if (!session?.user?.id) {
      return;
    }

    let isActive = true;

    const loadUnlockedRecipes = async () => {
      try {
        const response = await fetch("/api/orders");
        if (!response.ok) return;

        const payload = await response.json();
        const completedOrders = (payload.orders || []).filter(
          (order: { status?: string }) => order.status === "completed"
        );

        const unlockedIds = new Set<string>();
        for (const order of completedOrders) {
          for (const item of order.items || []) {
            if (item?.id && typeof item.id === "string") {
              unlockedIds.add(item.id);
            }
          }
        }

        if (isActive) {
          setUnlockedRecipeIds(unlockedIds);
        }
      } catch (error) {
        console.error("Failed to load unlocked recipes:", error);
      }
    };

    void loadUnlockedRecipes();

    return () => {
      isActive = false;
    };
  }, [session?.user?.id, isPending]);

  const toggleCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  // Filter only paid recipes
  const paidRecipes = data.recipes.filter((recipe) => 
    recipe.price && recipe.price !== "Free"
  );

  // Filter paid recipes based on selected categories and search query
  const filteredRecipes = paidRecipes.filter((recipe) => {
    // Filter by category
    const categoryMatch =
      selectedCategories.size === 0 ||
      (recipe.categoryIds ?? []).some((categoryId) => selectedCategories.has(categoryId));
    
    // Filter by search query
    const searchMatch = searchQuery === "" || 
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return categoryMatch && searchMatch;
  });

  const visibleUnlockedRecipeIds = session?.user?.id
    ? unlockedRecipeIds
    : new Set<string>();

  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden font-metropolis">
      {/* --- BANNER --- */}
      <section className="relative w-full min-h-[420px] lg:min-h-[360px] 2xl:min-h-[400px] overflow-hidden flex items-center">
        <div className="absolute inset-0">
          {data.bannerImagePath && (
            <Image
              src={data.bannerImagePath}
              alt="Background"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/52" />
        </div>

        <div className="relative z-10 w-full py-16 lg:py-14 2xl:py-16">
          <Container>
            <div className="max-w-3xl flex flex-col gap-4 lg:gap-3 2xl:gap-4">
              <h1 className="font-bold text-white text-4xl md:text-5xl lg:text-4xl 2xl:text-5xl leading-[1.1] drop-shadow-lg">
                {data.bannerTitle.split(/\n|<br>/).map((line, index, arr) => (
                  <span key={index}>
                    {line}
                    {index < arr.length - 1 && <br />}
                  </span>
                ))}
              </h1>
              <p className="text-white text-lg md:text-xl lg:text-base 2xl:text-lg opacity-90 max-w-2xl leading-snug drop-shadow-md">
                {data.bannerDescription}
              </p>
            </div>
          </Container>
        </div>
      </section>

      {/* --- SHOP SECTION --- */}
      <section className="bg-[#F4F4F4] py-20 lg:py-12 2xl:py-14">
        <Container className="flex flex-col items-center">
          <h2 className="font-bebas text-6xl md:text-7xl lg:text-5xl 2xl:text-5xl text-black mb-10 lg:mb-6 2xl:mb-6 leading-none">
            PREMIUM RECIPES
          </h2>

          <div className="relative w-full mb-12 lg:mb-8 2xl:mb-8">
            <Input
              placeholder="Search premium recipes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-20 lg:h-14 2xl:h-16 bg-white rounded-lg px-10 lg:px-7 2xl:px-8 border-none shadow-sm text-xl lg:text-base 2xl:text-lg placeholder:text-black/40"
            />
            <Search className="absolute right-10 lg:right-7 2xl:right-8 top-1/2 -translate-y-1/2 w-8 lg:w-5 2xl:w-6 h-8 lg:h-5 2xl:h-6 text-[#0F8DAB] stroke-[2.5]" />
          </div>

          {selectedCategories.size > 0 && (
            <div className="mb-12 lg:mb-8 2xl:mb-8 flex flex-col sm:flex-row items-center justify-center gap-6 lg:gap-3 2xl:gap-4 px-4">
              <span className="text-lg lg:text-sm 2xl:text-base font-semibold text-gray-700">
                Filtering by {selectedCategories.size} categor{selectedCategories.size === 1 ? 'y' : 'ies'}
              </span>
              <Button 
                onClick={() => setSelectedCategories(new Set())}
                className="bg-[#0F8DAB] hover:bg-[#0d7a94] text-white font-bold px-8 lg:px-5 2xl:px-6 py-3 lg:py-1.5 2xl:py-2 rounded-lg lg:rounded-md 2xl:rounded-md text-base lg:text-xs 2xl:text-sm transition-colors"
              >
                Clear Filters
              </Button>
            </div>
          )}

          <div className="w-full mb-20 lg:mb-12 2xl:mb-14 relative px-4">
            <Carousel setApi={setApi} opts={{ align: "start", loop: true }}>
              <CarouselContent className="-ml-4">
                {data.categories.map((cat: RecipeCategory) => {
                  const isSelected = selectedCategories.has(cat.id);

                  return (
                    <CarouselItem key={cat.id} className="pl-4 basis-1/2 md:basis-1/5 lg:basis-1/6 2xl:basis-1/6">
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        aria-pressed={isSelected}
                        aria-label={`Toggle ${cat.name} category`}
                        className={`relative h-[140px] md:h-[160px] lg:h-[115px] 2xl:h-[130px] w-full rounded-lg lg:rounded-md 2xl:rounded-lg overflow-hidden group cursor-pointer shadow-sm transition-all duration-300 ease-in-out text-left ${
                          isSelected
                            ? "shadow-[0_8px_22px_rgba(15,141,171,0.35)]"
                            : "hover:scale-105"
                        }`}
                      >
                        {cat.imagePath && (
                          <Image
                            src={cat.imagePath}
                            fill
                            sizes="(min-width: 1024px) 16vw, (min-width: 768px) 20vw, 50vw"
                            className={`object-cover transition-transform duration-500 ease-out ${
                              isSelected ? "scale-[1.1]" : "scale-[1.02] group-hover:scale-105"
                            }`}
                            alt={cat.name}
                          />
                        )}
                        <div
                          className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                            isSelected
                              ? "bg-gradient-to-t from-black/2 via-black/0 to-transparent"
                              : "bg-gradient-to-t from-black/88 via-black/66 to-black/38 group-hover:from-black/82 group-hover:via-black/60"
                          }`}
                        />
                        {isSelected && (
                          <>
                            <div className="pointer-events-none absolute inset-[2px] rounded-[inherit] border-2 border-[#0F8DAB]" />
                            <div className="pointer-events-none absolute inset-[5px] rounded-[inherit] border border-white/80" />
                          </>
                        )}
                        <h3
                          className={`absolute inset-0 flex items-center justify-center font-bebas text-4xl lg:text-2xl 2xl:text-3xl tracking-wide transition-colors duration-300 ${
                            isSelected
                              ? "text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.65)]"
                              : "text-white/95"
                          }`}
                        >
                          {cat.name}
                        </h3>
                        {isSelected && (
                          <div className="absolute top-2 right-2 lg:top-1.5 lg:right-1.5 flex h-6 w-6 lg:h-5 lg:w-5 items-center justify-center rounded-full border border-[#0F8DAB] bg-[#00676E] text-white shadow-[0_2px_8px_rgba(0,103,110,0.45)]">
                            <Check className="h-3.5 w-3.5 lg:h-3 lg:w-3" />
                          </div>
                        )}
                      </button>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
            {data.categories.length > 1 && (
              <>
                <CarouselArrowButton
                  side="previous"
                  tone="subtle"
                  onClick={() => api?.scrollPrev()}
                  aria-label="Previous category"
                >
                  <ChevronLeft className="size-3.5" />
                </CarouselArrowButton>
                <CarouselArrowButton
                  side="next"
                  tone="subtle"
                  onClick={() => api?.scrollNext()}
                  aria-label="Next category"
                >
                  <ChevronRight className="size-3.5" />
                </CarouselArrowButton>
              </>
            )}
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl text-gray-500">No premium recipes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 2xl:gap-6 w-full">
              {filteredRecipes.map((item: Recipe) => {
                const recipeHref = visibleUnlockedRecipeIds.has(item.id)
                  ? `/recipes/detail/${item.slug}/full`
                  : `/recipes/detail/${item.slug}`;

                return (
                <div
                  key={item.id}
                  className="group block h-full"
                >
                  <div className="flex h-full flex-col overflow-hidden rounded-none border border-[#D8D8D8] bg-white">
                    <Link href={recipeHref} className="block">
                      <div className="relative h-[250px] lg:h-[205px] 2xl:h-[220px] overflow-hidden">
                    {item.imagePath && (
                      <Image
                        src={item.imagePath}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={item.title}
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      />
                    )}

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-colors duration-300" />

                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <span className="text-lg lg:text-base 2xl:text-lg font-bebas tracking-[0.12em] text-white">
                            VIEW RECIPE
                          </span>
                        </div>

                        <div
                          className="absolute top-0 right-0 bg-[#0F8DAB] w-20 h-20 lg:w-16 lg:h-16 flex justify-end items-start"
                          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
                        >
                          <span className="font-bold text-lg lg:text-base text-white pt-3 pr-3 lg:pt-2 lg:pr-2">
                            {item.price}
                          </span>
                        </div>

                        {visibleUnlockedRecipeIds.has(item.id) && (
                          <div className="absolute top-3 left-3 rounded-none bg-[#E8F5F5] px-2 py-1 text-[11px] font-semibold text-[#00676E]">
                            UNLOCKED
                          </div>
                        )}

                        {item.featured && (
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                            <span className="inline-flex items-center rounded-full border-[3px] border-[#0F8DAB] bg-white/35 px-7 py-1.5 text-lg lg:text-sm 2xl:text-base font-semibold uppercase tracking-wide text-[#0F8DAB] backdrop-blur-sm shadow-[0_4px_14px_rgba(15,141,171,0.25)]">
                              Featured
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex h-[190px] lg:h-[175px] 2xl:h-[186px] flex-col gap-3 overflow-hidden px-4 py-4">
                      <Link href={recipeHref}>
                        <h4 className="line-clamp-2 font-bold text-[34px] lg:text-[36px] 2xl:text-[38px] text-black leading-none uppercase transition-colors duration-300 group-hover:text-[#0F8DAB] font-['Bebas_Neue']">
                          {item.title}
                        </h4>
                      </Link>
                      <p className="text-[#5A5A5A] text-[18px] lg:text-[15px] 2xl:text-[16px] leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}
