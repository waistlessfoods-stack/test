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
      <section className="w-full px-4 md:px-12 py-12">
        <div className="relative w-full aspect-16/5 min-h-[400px] overflow-hidden rounded-[40px] flex items-center">
          <div className="absolute inset-0">
            <Image
              src="/recipes/banner-recipes.png"
              alt="Wholesome Recipes Background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="relative z-10 px-8 md:px-16 w-full lg:w-[60%] flex flex-col gap-6">
            <h1 className="font-metropolis font-bold text-white text-4xl md:text-5xl lg:text-6xl leading-tight max-w-3xl">
              Wholesome Recipes for Every Mood
            </h1>
            <p className="font-metropolis text-white text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">
              From quick bites to hearty meals, explore dishes made with simple
              ingredients, bold flavors, and mindful cooking.
            </p>
          </div>

          <div className="hidden lg:flex relative z-10 w-1/2 h-full items-center justify-end pr-16 gap-6">
            <div className="relative w-[280px] h-[360px] rounded-3xl overflow-hidden shadow-2xl transform translate-y-4">
              <Image
                src="/recipes/mango.png"
                alt="Mango Parfait"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative w-60 h-[200px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/recipes/cake.png"
                alt="Brownie"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- GALLERY SECTION --- */}
      <section className="bg-[#F4F4F4] px-4 md:px-12 py-20 flex flex-col items-center">
        <h2 className="font-bebas text-6xl md:text-7xl text-black mb-10 leading-none">
          RECIPE GALLERY
        </h2>

        {/* SEARCH BAR */}
        <div className="relative w-full mb-16">
          <Input
            placeholder="Find something food"
            className="w-full h-20 bg-white rounded-none px-10 border-none shadow-sm focus-visible:ring-0 
              text-xl font-metropolis text-black 
              placeholder:font-metropolis 
              placeholder:text-lg 
              placeholder:text-black/50"
          />
          <Search className="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-8 text-black stroke-[2.5]" />
        </div>

        {/* CATEGORY CAROUSEL */}
        <div className="w-full mb-24 relative">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true }}
            className="w-full px-2"
          >
            <CarouselContent className="-ml-4">
              {categories.map((cat, i) => (
                <CarouselItem
                  key={i}
                  className="pl-4 md:basis-1/2 lg:basis-1/4"
                >
                  <div className="relative h-[200px] rounded-3xl overflow-hidden group cursor-pointer shadow-md">
                    <img
                      src={cat.img}
                      className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110"
                      alt={cat.name}
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <h3 className="relative z-10 h-full flex items-center justify-center font-bebas text-4xl text-white uppercase">
                      {cat.name}
                    </h3>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute -left-4 -mt-8 w-12 h-12 z-30 bg-white border-[#B0B0B0]" />
            <CarouselNext className="absolute -right-4 -mt-8 w-12 h-12 z-30 bg-white border-[#B0B0B0]" />
          </Carousel>
        </div>

        {/* --- RECIPE GRID LIST --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24 w-full">
          {recipes.map((item, idx) => (
            <div key={idx} className="group cursor-pointer">
              <div className="relative aspect-square w-full rounded-[48px] overflow-hidden bg-white shadow-xl mb-10">
                <img
                  src={item.img}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt={item.title}
                />

                <div
                  className="absolute top-0 right-0 bg-[#0F8DAB] w-32 h-32 md:w-40 md:h-40 flex justify-end items-start"
                  style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
                >
                  <span className="font-metropolis font-bold text-2xl md:text-3xl text-white pt-6 pr-4">
                    {item.price}
                  </span>
                </div>

                {item.price !== "Free" && (
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    <Button className="w-[90%] h-16 bg-[#0F8DAB] hover:bg-[#0d7a94] text-xl font-bold tracking-widest rounded-t-[35px] rounded-b-none border-none">
                      FEATURED
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 px-2">
                <h4 className="font-metropolis font-bold text-2xl md:text-3xl text-black leading-tight group-hover:text-[#0F8DAB] transition-colors">
                  {item.title}
                </h4>
                <p className="font-metropolis text-base md:text-lg leading-relaxed text-gray-800 line-clamp-2">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
