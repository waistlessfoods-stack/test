"use client";

import { Container } from "@/components/ui/container";
import Image from "next/image";
import type { AboutPageData } from "@/lib/contentful-management";

type AboutPageClientProps = {
  data: AboutPageData;
};

export default function AboutPageClient({ data }: AboutPageClientProps) {
  const introParagraphs = [data.heroParagraph1, data.heroParagraph2].filter(Boolean);
  const waistLessIntroParagraphs = [
    data.contentParagraph1,
    data.contentParagraph2,
    data.contentParagraph3,
    data.contentParagraph4,
  ].filter(Boolean);

  const waistLessSections = [
    {
      heading: data.contentHeading2A,
      paragraphs: [data.contentParagraph5],
    },
    {
      heading: data.contentHeading2B,
      paragraphs: [data.contentParagraph6, data.contentParagraph7],
    },
    {
      heading: data.contentHeading2C,
      paragraphs: [data.contentParagraph8],
    },
  ].filter((section) => section.heading || section.paragraphs.some(Boolean));

  return (
    <main className="w-full bg-[#FBFAF7] text-[#171717] antialiased">
      <section className="w-full py-16 md:py-24">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:gap-16">
            <div className="flex max-w-3xl flex-col gap-7">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#388082]">
                About Chef Amber
              </p>
              <h1 className="font-bebas text-6xl leading-[0.9] tracking-wide text-[#111111] sm:text-7xl lg:text-8xl">
                {data.heroTitle.split(/\\n|\n/).map((line, index, arr) => (
                  <span key={index}>
                    {line}
                    {index < arr.length - 1 && <br />}
                  </span>
                ))}
              </h1>

              <div className="flex flex-col gap-5 text-base leading-7 text-[#424242] md:text-lg md:leading-8">
                {introParagraphs.map((paragraph, index) => (
                  <p key={`intro-${index}`}>{paragraph}</p>
                ))}
              </div>
            </div>

            {data.contentImagePath && (
              <div className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-md bg-[#E7E1D8] shadow-sm lg:mx-0 lg:justify-self-end">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={data.contentImagePath}
                    fill
                    alt="Chef Amber"
                    sizes="(min-width: 1024px) 420px, 90vw"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>

      <section className="w-full bg-[#F4F4F4] py-16 md:py-24">
        <Container>
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(280px,460px)_minmax(0,1fr)] lg:gap-16">
            {data.contentImage2Path && (
              <div className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-md bg-[#E6E6E2] lg:sticky lg:top-28 lg:mx-0">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={data.contentImage2Path}
                    fill
                    alt="WaistLess Foods"
                    sizes="(min-width: 1024px) 460px, 90vw"
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-5">
                <h2 className="font-bebas text-5xl leading-none tracking-wide text-[#111111] md:text-6xl">
                  {data.contentHeading}
                </h2>

                <div className="flex flex-col gap-4 text-base leading-7 text-[#424242]">
                  {waistLessIntroParagraphs.map((paragraph, index) => (
                    <p key={`waistless-intro-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </div>

              {(data.contentHeading2 || waistLessSections.length > 0) && (
                <div className="flex flex-col gap-6 border-t border-[#D7D4CF] pt-8">
                  {data.contentHeading2 && (
                    <h3 className="text-xl font-semibold leading-snug tracking-tight text-[#111111] md:text-2xl">
                      {data.contentHeading2}
                    </h3>
                  )}

                  <div className="flex flex-col gap-6">
                    {waistLessSections.map((section, index) => (
                      <section
                        key={`${section.heading}-${index}`}
                        className="flex flex-col gap-3"
                      >
                        {section.heading && (
                          <h4 className="text-base font-semibold leading-snug text-[#00676E] md:text-lg">
                            {section.heading}
                          </h4>
                        )}
                        <div className="flex flex-col gap-4 text-sm leading-7 text-[#4A4A4A] md:text-base">
                          {section.paragraphs.filter(Boolean).map((paragraph, paragraphIndex) => (
                            <p key={`${section.heading}-${paragraphIndex}`}>
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
