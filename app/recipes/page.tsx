"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
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

export default function Recipes() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const categories = [
    { name: "BEEF", img: "/recipes/beef.png" },
    { name: "FISH & SEAFOOD", img: "/recipes/fish-seafood.png" },
    { name: "PASTA", img: "/recipes/pasta.png" },
    { name: "HEALTHY MEALS", img: "/recipes/meals.png" },
    { name: "DESSERT", img: "/recipes/donuts.png" },
    { name: "VEGAN", img: "/recipes/potato.png" },
    { name: "BREAKFAST", img: "/recipes/mango.png" },
  ];

  const recipes = [
    {
      title: "Apple Peanut Donut Bites",
      price: "$12",
      img: "/recipes/donuts.png",
      desc: "Crisp apple rings layered with peanut butter, topped with almonds and choco chips",
    },
    {
      title: "Almond Fudge Brownie",
      price: "Free",
      img: "/recipes/cake.png",
      desc: "Rich, fudgy chocolate brownie topped with crunchy almond slices indulgent,",
    },
    {
      title: "Creamy Tuna Roll",
      price: "$12",
      img: "/recipes/creamy.png",
      desc: "Soft roll filled with creamy tuna salad and fresh veggies, served with crispy chips.",
    },
    {
      title: "Mango Mint Chia Parfait",
      price: "$12",
      img: "/recipes/mango.png",
      desc: "Tropical layers of chia pudding, mango puree, and fresh mint - perfect morning boost.",
    },
    {
      title: "Herby Pasta Primavera",
      price: "$12",
      img: "/recipes/herby-pasta.png",
      desc: "Colorful, cozy, and bursting with fresh veggies and herbs - your go-to dinner.",
    },
    {
      title: "Sweet Potato & Chickpea",
      price: "$12",
      img: "/recipes/potato.png",
      desc: "Power-packed with protein and fiber. A hearty vegan bowl with roasted sweet potatoes.",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden font-metropolis">
      {/* --- BANNER --- */}
      <section className="w-full px-4 md:px-10 py-20">
        <div className="relative w-full max-w-[1440px] mx-auto aspect-16/7 min-h-[400px] overflow-hidden rounded-[40px] flex items-center shadow-md">
          <div className="absolute inset-0">
            <Image
              src="/recipes/banner-recipes.png"
              alt="Background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="relative z-10 px-8 md:px-20 flex flex-col md:flex-row items-center justify-between w-full h-full">
            <div className="flex-1 max-w-3xl flex flex-col gap-4 mt-10 md:mt-0">
              <h1 className="font-bold text-white text-4xl md:text-5xl lg:text-6xl leading-[1.1] drop-shadow-lg">
                Wholesome Recipes for <br className="hidden lg:block" /> Every
                Mood
              </h1>
              <p className="text-white text-lg md:text-xl opacity-90 max-w-xl leading-snug drop-shadow-md">
                From quick bites to hearty meals, explore dishes made with
                simple ingredients, bold flavors, and mindful cooking.
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-6 self-center h-full pt-10">
              <div className="relative w-60 h-80 rounded-3xl overflow-hidden shadow-2xl translate-y-4">
                <Image
                  src="/recipes/mango.png"
                  fill
                  className="object-cover"
                  alt="Mango"
                />
              </div>
              <div className="relative w-[200px] h-[200px] rounded-3xl overflow-hidden shadow-2xl translate-y-4">
                <Image
                  src="/recipes/cake.png"
                  fill
                  className="object-cover"
                  alt="Cake"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F4F4] py-16 md:py-20">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col items-center">
          <h2 className="font-bebas text-[80px] md:text-[100px] text-black mb-8 leading-none tracking-tight">
            RECIPE GALLERY
          </h2>

          <div className="relative w-full mb-12">
            <Input
              placeholder="Find something food"
              className="w-full h-20 bg-white rounded-none px-10 border-none shadow-sm text-xl placeholder:text-black/40"
            />
            <Search className="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-8 text-black stroke-[2.5]" />
          </div>

          <div className="w-full mb-20 relative px-4">
            <Carousel setApi={setApi} opts={{ align: "start", loop: true }}>
              <CarouselContent className="-ml-4">
                {categories.map((cat, i) => (
                  <CarouselItem key={i} className="pl-4 basis-1/2 md:basis-1/4">
                    <div className="relative h-[180px] md:h-[220px] rounded-4xl overflow-hidden group cursor-pointer shadow-sm">
                      <Image
                        src={cat.img}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        alt={cat.name}
                      />
                      <div className="absolute inset-0 bg-black/40" />
                      <h3 className="absolute inset-0 flex items-center justify-center font-bebas text-4xl text-white">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16 w-full">
            {recipes.map((item, idx) => (
              <div key={idx} className="group">
                <div className="relative aspect-square w-full rounded-[48px] overflow-hidden bg-white shadow-lg mb-8">
                  <Image
                    src={item.img}
                    fill
                    className="object-cover"
                    alt={item.title}
                  />

                  <div
                    className="absolute top-0 right-0 bg-[#0F8DAB] w-36 h-36 flex justify-end items-start"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
                  >
                    <span className="font-bold text-3xl text-white pt-6 pr-6">
                      {item.price}
                    </span>
                  </div>

                  {item.price !== "Free" && (
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                      <Button className="w-[90%] h-16 bg-[#0F8DAB] hover:bg-[#0d7a94] text-xl font-bold tracking-widest rounded-t-[35px] rounded-b-none">
                        FEATURED
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 px-4">
                  <h4 className="font-bold text-3xl text-black leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-gray-700 text-lg leading-relaxed line-clamp-3">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
