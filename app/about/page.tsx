import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import React from "react";

export default function About() {
  return (
    <main className="w-full bg-white antialiased">
      <section className="relative w-full h-auto min-h-[420px] md:h-[850px] overflow-hidden flex items-start md:items-center bg-[#1a1a1a]">
        <div className="absolute inset-0 z-0">
          <Image
            src="/about/chef-bg.png"
            fill
            alt="Chef Amber Background"
            className="object-cover object-top scale-110 origin-top md:scale-100 md:object-top-right"
            priority
          />

          <div className="absolute inset-0 bg-linear-to-r from-black via-black/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-[1440px] px-6 md:pl-[90px] md:pr-6 pt-16 pb-24 md:py-0">
          <div className="flex flex-col gap-[30px] md:gap-[41px]">
            <div className="w-fit">
              <h1 className="font-bebas text-[55px] md:text-[100px] leading-[0.9] tracking-[0.01em] uppercase text-white">
                Hey There!
                <br />
                I'm Amber
              </h1>
            </div>

            <div className="w-full md:w-[608px] flex flex-col gap-5 md:gap-[30px] font-metropolis text-[18px] md:text-[26px] leading-snug tracking-[-0.02em] text-white">
              <p className="font-medium">
                Chef Amber is the creative force behind WaistLess Foods,
                blending flavor, sustainability, and heart into every dish she
                makes.
              </p>

              <p className="font-medium">
                As a Houston-based private chef, Amber transforms everyday
                ingredients into soulful, nourishing meals designed to make
                healthy eating effortless and enjoyable.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#F4F4F4] pt-[70px] pb-[70px] px-6 md:px-[86px]">
        <Card className="max-w-[1440px] border-none bg-transparent shadow-none">
          <CardContent className="p-0 flex flex-col md:flex-row items-center gap-10 md:gap-[97px]">
            <div className="w-full md:w-[650px] shrink-0">
              <AspectRatio
                ratio={1 / 1}
                className="bg-[#D3D3D3] rounded-[12px] overflow-hidden relative"
              >
                <Image
                  src="/about/food-img.png"
                  fill
                  alt="WaistLess Foods Background"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-white/80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-[35%] h-[35%]">
                    <Image
                      src="/logo.png"
                      fill
                      alt="Logo WaistLess"
                      className="object-contain"
                    />
                  </div>
                </div>
              </AspectRatio>
            </div>

            <div className="w-full md:w-[608px] flex flex-col gap-[38px]">
              <h2 className="font-sans font-semibold text-[34px] leading-6 tracking-[-0.02em] text-black">
                More about waistless
              </h2>

              <div className="flex flex-col gap-[30px] font-sans font-normal text-[26px] leading-[30px] tracking-[-0.02em] text-black">
                <p>
                  WaistLess is built on the idea that good food shouldn’t come
                  with waste—of ingredients, time, or intention.
                </p>

                <p>
                  Chef Amber created WaistLess as a space to share recipes,
                  techniques, and simple habits that make cooking more
                  sustainable and more joyful. From everyday meals to family
                  gatherings, every part of WaistLess centers around flavor,
                  quality, and mindful living.
                </p>

                <p>
                  Here, we help you eat better, live brighter, and waste less
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
