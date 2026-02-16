import Image from "next/image";
import React from "react";

export default function About() {
  return (
    <main className="w-full bg-white antialiased">
      <section className="w-full bg-white pt-[70px] pb-[70px] px-6 md:px-[74px]">
        <div className="max-w-[1440px] mx-auto flex flex-col-reverse md:flex-row items-center justify-between gap-10 md:gap-[133px]">
          <div className="w-full md:w-[608px] flex flex-col gap-[38px]">
            <h1 className="font-[family-name:--font-bebas-neue)] text-[66px] leading-[100%] tracking-[0.01em] uppercase text-black">
              Hey There!
              <br />
              I'm Amber
            </h1>

            <div className="flex flex-col gap-[30px] font-[family-name:--font-metropolis)] text-[26px] leading-[30px] tracking-[-0.02em]">
              <p className="font-medium text-black">
                Chef Amber is the creative force behind WaistLess Foods,
                blending flavor, sustainability, and heart into every dish she
                makes.
              </p>

              <p className="font-medium text-[#828282]">
                As a Houston-based private chef, Amber transforms everyday
                ingredients into soulful, nourishing meals designed to make
                healthy eating effortless and enjoyable.
              </p>

              <p className="font-medium text-[#828282]">
                Her journey began cooking for her family of four — now it's her
                mission to show that mindful cooking can be both exciting and
                full of love.
              </p>
            </div>
          </div>

          <div className="w-full md:w-[551px]">
            <div className="relative w-full aspect-square rounded-[12px] overflow-hidden shadow-sm">
              <Image
                src="/about/chef-img.png"
                fill
                alt="Chef Amber"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#F4F4F4] pt-[70px] pb-[70px] px-6 md:px-[86px]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-[97px]">
          <div className="w-full md:w-[547px]">
            <div className="relative w-full h-[543px] bg-[#D3D3D3] rounded-[12px] overflow-hidden">
              <Image
                src="/about/food-img.png"
                fill
                alt="WaistLess Foods Background"
                className="object-cover"
              />

              <div className="absolute inset-0 bg-white/80" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[301px] h-[301px]">
                  <Image
                    src="/logo.png"
                    fill
                    alt="Logo WaistLess"
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
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
                techniques, and simple habits that make cooking more sustainable
                and more joyful. From everyday meals to family gatherings, every
                part of WaistLess centers around flavor, quality, and mindful
                living.
              </p>

              <p>Here, we help you eat better, live brighter, and waste less</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
