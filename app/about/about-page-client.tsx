"use client";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import Image from "next/image";
import type { AboutPageData } from "@/lib/contentful-management";

type AboutPageClientProps = {
  data: AboutPageData;
};

export default function AboutPageClient({ data }: AboutPageClientProps) {
  return (
    <main className="w-full bg-white antialiased">
      {/* --- HERO SECTION --- */}
      <section className="relative w-full h-auto min-h-[420px] md:h-[850px] overflow-hidden flex items-start md:items-center bg-[#1a1a1a]">
        <div className="absolute inset-0 z-0">
          <Image
            src={data.heroBackgroundImagePath}
            fill
            alt="Chef Amber Background"
            className="object-cover object-top scale-110 origin-top md:scale-100 md:object-top-right"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-r from-black via-black/60 to-transparent" />
        </div>

        <Container className="relative z-10 pt-16 pb-24 md:py-0">
          <div className="flex flex-col gap-8 md:gap-10">
            <div className="w-fit">
              <h1 className="font-bebas text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight uppercase text-white">
                {data.heroTitle.split(/\\n|\n/).map((line, index, arr) => (
                  <span key={index}>
                    {line}
                    {index < arr.length - 1 && <br />}
                  </span>
                ))}
              </h1>
            </div>

            <div className="w-full md:w-[608px] flex flex-col gap-6 font-metropolis text-lg md:text-xl lg:text-2xl leading-relaxed tracking-tight text-white">
              <p className="font-medium">{data.heroParagraph1}</p>

              <p className="font-medium">{data.heroParagraph2}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* --- CONTENT SECTION --- */}
      <section className="w-full bg-[#F4F4F4] py-16 md:py-24">
        <Container>
          <Card className="border-none bg-transparent shadow-none">
            <CardContent className="p-0 flex flex-col md:flex-row items-center gap-12 lg:gap-20">
              <div className="w-full flex-1 max-w-[550px]">
                <AspectRatio
                  ratio={1 / 1}
                  className="bg-[#D3D3D3] rounded-2xl overflow-hidden relative shadow-lg"
                >
                  <Image
                    src={data.contentImagePath}
                    fill
                    alt="WaistLess Foods"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-white/80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[35%] h-[35%]">
                      <Image
                        src={data.logoImagePath}
                        fill
                        alt="Logo WaistLess"
                        className="object-contain"
                      />
                    </div>
                  </div>
                </AspectRatio>
              </div>

              <div className="w-full flex-1 flex flex-col gap-6">
                <h2 className="font-sans font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight text-black capitalize">
                  {data.contentHeading}
                </h2>

                <div className="flex flex-col gap-6 font-sans font-normal text-base md:text-lg lg:text-xl leading-relaxed text-gray-900">
                  <p>{data.contentParagraph1}</p>

                  <p>{data.contentParagraph2}</p>

                  <p>{data.contentParagraph3}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    </main>
  );
}
