"use client";

import React from "react";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import type { Recipe } from "@/lib/contentful-management";

type RecipesPageProps = {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<{
    recipe?: string;
  }>;
};

export default async function RecipesPage({ params, searchParams }: RecipesPageProps) {
  const { category } = await params;
  const { recipe } = await searchParams;

  // Mock recipe data - replace with actual data fetching
  const recipeData: Recipe = {
    id: "1",
    slug: "apple-peanut-donut-bites",
    title: "Apple Peanut Donut Bites",
    description:
      "Crisp apple rings layered with creamy peanut butter, sprinkled with nuts and chocolate chips — a wholesome, fun, and gluten-free treat perfect for snacking or breakfast.",
    price: "$15.00",
    imagePath: "/recipes/apple-donut.jpg",
    categoryId: category,
    sortOrder: 1,
  };

  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden font-metropolis">
      <section className="w-full py-16 2xl:py-12">
        <Container>
          {/* Breadcrumb */}
          <div className="flex items-center gap-4 mb-16 2xl:mb-12">
            <span className="text-xl 2xl:text-lg font-medium text-black">Recipes</span>
            <span className="text-xl 2xl:text-lg text-black">/</span>
            <span className="text-xl 2xl:text-lg font-medium text-black">
              Detail recipes
            </span>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-14 2xl:gap-8">
            {/* Left Side - Image */}
            <div className="w-full lg:w-1/2 flex items-center">
              <div className="relative w-full aspect-square lg:aspect-auto lg:h-[642px] rounded-lg 2xl:rounded-lg overflow-hidden bg-[#E9E9E9] shadow-lg">
                <Image
                  src={recipeData.imagePath}
                  alt={recipeData.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Right Side - Details */}
            <div className="w-full lg:w-1/2 flex flex-col gap-12 2xl:gap-8 justify-start">
              {/* Title */}
              <h1 className="font-metropolis font-medium text-5xl 2xl:text-4xl text-black leading-tight">
                {recipeData.title}
              </h1>

              {/* Description Section */}
              <div className="flex flex-col gap-5 2xl:gap-4">
                <h3 className="font-medium text-2xl 2xl:text-xl text-black">
                  Description
                </h3>
                <p className="font-normal text-xl 2xl:text-lg text-gray-600 leading-relaxed">
                  {recipeData.description}
                </p>
              </div>

              {/* Price Box */}
              <div className="bg-[#F7F7F7] rounded-lg 2xl:rounded-lg p-5 2xl:p-4">
                <div className="flex flex-col gap-5 2xl:gap-4">
                  {/* Price Row */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xl 2xl:text-lg text-gray-700">
                      Price :
                    </span>
                    <span className="font-bold text-4xl 2xl:text-3xl text-black">
                      {recipeData.price}
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 2xl:gap-2 w-full">
                    <Button className="flex-1 h-14 2xl:h-12 bg-[#FB7118] hover:bg-[#E86510] text-white font-medium text-lg 2xl:text-base rounded-lg 2xl:rounded-md transition-colors">
                      Add to cart
                    </Button>
                    <Button className="flex-1 h-14 2xl:h-12 bg-[#388082] hover:bg-[#2F6A6B] text-white font-medium text-lg 2xl:text-base rounded-lg 2xl:rounded-md transition-colors">
                      Order now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
