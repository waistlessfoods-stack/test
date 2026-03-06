"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RecipesPageData, RecipeCategory, Recipe } from "@/lib/contentful-management";

type ShopPageClientProps = {
  data: RecipesPageData;
};

export default function ShopPageClient({ data }: ShopPageClientProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

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
    const categoryMatch = selectedCategories.size === 0 || (recipe.categoryId && selectedCategories.has(recipe.categoryId));
    
    // Filter by search query
    const searchMatch = searchQuery === "" || 
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return categoryMatch && searchMatch;
  });

  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden font-metropolis">
      {/* --- BANNER --- */}
      <section className="w-full py-12 lg:py-8 2xl:py-8">
        <Container>
          <div className="relative w-full aspect-16/5 min-h-[400px] lg:min-h-[280px] 2xl:min-h-[300px] overflow-hidden rounded-[40px] lg:rounded-[28px] 2xl:rounded-[30px] flex items-center">
            <div className="absolute inset-0">
              <Image
                src={data.bannerImagePath}
                alt="Background"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/50" />
            </div>

            <div className="relative z-10 px-8 md:px-20 lg:px-12 2xl:px-12 flex flex-col md:flex-row items-center justify-between w-full h-full">
              <div className="flex-1 max-w-3xl flex flex-col gap-4 lg:gap-2.5 2xl:gap-3 mt-10 md:mt-0">
                <h1 className="font-bold text-white text-4xl md:text-5xl lg:text-4xl 2xl:text-5xl leading-[1.1] drop-shadow-lg">
                  Premium Recipe Shop
                </h1>
                <p className="text-white text-lg md:text-xl lg:text-base 2xl:text-lg opacity-90 max-w-xl leading-snug drop-shadow-md">
                  Discover our exclusive collection of premium recipes. Add them to your cart and unlock professional cooking secrets.
                </p>
              </div>

              <div className="hidden lg:flex items-center gap-6 lg:gap-3 2xl:gap-4 self-center h-full pt-10 lg:pt-5">
                {data.bannerFeaturedImage1Path && (
                  <div className="relative w-60 h-80 lg:w-36 lg:h-48 2xl:w-48 2xl:h-64 rounded-3xl lg:rounded-xl 2xl:rounded-2xl overflow-hidden shadow-2xl translate-y-4 lg:translate-y-3">
                    <Image
                      src={data.bannerFeaturedImage1Path}
                      fill
                      className="object-cover"
                      alt="Featured Recipe 1"
                    />
                  </div>
                )}
                {data.bannerFeaturedImage2Path && (
                  <div className="relative w-[200px] h-[200px] lg:w-[130px] lg:h-[130px] 2xl:w-[160px] 2xl:h-[160px] rounded-3xl lg:rounded-xl 2xl:rounded-2xl overflow-hidden shadow-2xl translate-y-4 lg:translate-y-3">
                    <Image
                      src={data.bannerFeaturedImage2Path}
                      fill
                      className="object-cover"
                      alt="Featured Recipe 2"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
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
                {data.categories.map((cat: RecipeCategory) => (
                  <CarouselItem key={cat.id} className="pl-4 basis-1/2 md:basis-1/5 lg:basis-1/6 2xl:basis-1/6">
                    <div 
                      onClick={() => toggleCategory(cat.id)}
                      className={`relative h-[140px] md:h-[160px] lg:h-[115px] 2xl:h-[130px] rounded-4xl lg:rounded-2xl 2xl:rounded-3xl overflow-hidden group cursor-pointer shadow-sm transition-all duration-300 ease-in-out ${
                        selectedCategories.has(cat.id) ? 'ring-4 lg:ring-3 ring-[#0F8DAB] scale-95' : 'hover:scale-105'
                      }`}
                    >
                      <Image
                        src={cat.imagePath}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        alt={cat.name}
                      />
                      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all duration-300 ease-in-out" />
                      <h3 className="absolute inset-0 flex items-center justify-center font-bebas text-4xl lg:text-2xl 2xl:text-3xl text-white">
                        {cat.name}
                      </h3>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute -left-5 w-12 h-12 border-none shadow-xl" />
              <CarouselNext className="absolute -right-5 w-12 h-12 border-none shadow-xl" />
            </Carousel>
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl text-gray-500">No premium recipes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-10 lg:gap-x-5 2xl:gap-x-6 gap-y-16 lg:gap-y-10 2xl:gap-y-10 w-full">
              {filteredRecipes.map((item: Recipe) => (
                <div
                  key={item.id}
                  className="group block transition-transform duration-300 hover:-translate-y-2"
                >
                  <div className="relative aspect-square w-full rounded-[48px] lg:rounded-[32px] 2xl:rounded-[36px] overflow-hidden bg-white shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-8 lg:mb-5 2xl:mb-5">
                    <Link href={`/recipes/detail/${item.slug}`}>
                      <Image
                        src={item.imagePath}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={item.title}
                      />

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300" />

                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1/2 transition-all duration-300">
                        <span className="text-2xl lg:text-xl 2xl:text-2xl font-bebas tracking-widest text-white">
                          VIEW RECIPE
                        </span>
                      </div>
                    </Link>

                    <div
                      className="absolute top-0 right-0 bg-[#0F8DAB] w-36 lg:w-24 2xl:w-28 h-36 lg:h-24 2xl:h-28 flex justify-end items-start"
                      style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
                    >
                      <span className="font-bold text-3xl lg:text-xl 2xl:text-2xl text-white pt-6 lg:pt-4 2xl:pt-4 pr-6 lg:pr-4 2xl:pr-4">
                        {item.price}
                      </span>
                    </div>

                    {item.featured && (
                      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                        <Button className="w-[90%] h-16 lg:h-12 2xl:h-12 bg-[#0F8DAB] hover:bg-[#0d7a94] text-xl lg:text-base 2xl:text-base font-bold tracking-widest rounded-t-[35px] lg:rounded-t-[24px] 2xl:rounded-t-[25px] rounded-b-none pointer-events-none">
                          FEATURED
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 lg:gap-1.5 2xl:gap-2 px-4 lg:px-2 2xl:px-3">
                    <Link href={`/recipes/detail/${item.slug}`}>
                      <h4 className="font-bold text-3xl lg:text-xl 2xl:text-2xl text-black leading-tight transition-colors duration-300 group-hover:text-[#0F8DAB]">
                        {item.title}
                      </h4>
                    </Link>
                    <p className="text-gray-700 text-lg lg:text-sm 2xl:text-base leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}
