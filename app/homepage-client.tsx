"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  HomepageData,
  FeatureItem,
  FeaturedRecipe,
  Testimonial,
} from "@/lib/contentful-management";

type HomepageClientProps = {
  data: HomepageData;
};

export default function HomepageClient({ data }: HomepageClientProps) {
  const [heroApi, setHeroApi] = useState<CarouselApi>();
  const [heroCurrent, setHeroCurrent] = useState(0);
  const [testimonialApi, setTestimonialApi] = useState<CarouselApi>();
  const [testimonialCurrent, setTestimonialCurrent] = useState(0);

  const heroSlides =
    data.heroImagePaths?.length > 0
      ? data.heroImagePaths.slice(0, 3)
      : data.heroImagePath
        ? [data.heroImagePath]
        : [];

  useEffect(() => {
    if (!testimonialApi) return;

    const onSelect = () => {
      setTestimonialCurrent(testimonialApi.selectedScrollSnap());
    };

    onSelect();
    testimonialApi.on("select", onSelect);

    return () => {
      testimonialApi.off("select", onSelect);
    };
  }, [testimonialApi]);

  useEffect(() => {
    if (!heroApi) return;

    const onSelect = () => {
      setHeroCurrent(heroApi.selectedScrollSnap());
    };

    onSelect();
    heroApi.on("select", onSelect);

    return () => {
      heroApi.off("select", onSelect);
    };
  }, [heroApi]);

  useEffect(() => {
    if (!heroApi || heroSlides.length <= 1) return;

    const intervalId = window.setInterval(() => {
      heroApi.scrollNext();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [heroApi, heroSlides.length]);

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full min-h-[700px] md:h-[707px] flex items-center justify-center overflow-hidden">
        {heroSlides.length > 0 && (
          <Carousel
            setApi={setHeroApi}
            fade
            opts={{ align: "start", loop: heroSlides.length > 1 }}
            className="absolute inset-0"
          >
            <CarouselContent className="ml-0">
              {heroSlides.map((heroImagePath, index) => (
                <CarouselItem
                  key={`${heroImagePath}-${index}`}
                  className="pl-0 min-h-[700px] md:h-[707px]"
                >
                  <div className="relative h-full w-full min-h-[700px] md:h-[707px]">
                    <Image
                      src={heroImagePath}
                      alt={`Hero background ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {heroSlides.length > 1 && (
              <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={`hero-dot-${index}`}
                    onClick={() => heroApi?.scrollTo(index)}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      heroCurrent === index ? "bg-white scale-125" : "bg-white/55"
                    }`}
                    aria-label={`Go to hero slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </Carousel>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/55" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-[1200px] px-6 py-20">
          <div className="flex flex-col items-center gap-8 md:gap-12 max-w-[800px]">
            <div className="flex flex-col items-center gap-4 md:gap-6">
                <h1 className="text-5xl sm:text-7xl md:text-[100px] leading-[0.9] md:leading-24 tracking-wide uppercase text-white text-center font-['Bebas_Neue']">
                {data.heroTitle.split(/\\n|\n/).map((line, index, arr) => (
                  <span key={index}>
                    {line}
                    {index < arr.length - 1 && <br />}
                  </span>
                ))}
              </h1>

              <p className="text-lg md:text-[26px] leading-relaxed text-white text-center max-w-[600px]">
                {data.heroSubtitle}
              </p>
            </div>

            <div className="flex w-full max-w-[980px] flex-col gap-4 sm:flex-row sm:items-stretch">
              <Link href={data.heroPrimaryCtaHref} className="w-full sm:flex-1">
                <Button
                  size="lg"
                  className="h-auto min-h-[72px] w-full px-6 py-4 text-lg md:text-xl"
                >
                  {data.heroPrimaryCtaLabel}
                </Button>
              </Link>
              <Link href={data.heroSecondaryCtaHref} className="w-full sm:flex-1">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-auto min-h-[72px] w-full border-2 border-white bg-transparent px-6 py-4 text-lg text-white hover:bg-white/10 md:text-xl"
                >
                  {data.heroSecondaryCtaLabel}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 md:px-28 py-20 bg-white space-y-10 md:space-y-[78px]">
        <div className="flex flex-col items-center gap-6 max-w-[1222px] mx-auto text-center">
          <h2 className="text-[32px] md:text-[44px] font-medium tracking-[-0.02em] text-black leading-tight">
            {data.featuresHeading}
          </h2>
          <p className="max-w-[900px] text-[18px] md:text-[30px] tracking-[-0.02em] leading-relaxed md:leading-[34px] text-[#838383]">
            {data.featuresIntro}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[31px] max-w-[1222px] mx-auto">
          {data.features.map((item: FeatureItem) => (
            <div key={item.id} className="group flex flex-col w-full h-full">
              <div className="relative w-full aspect-387/257 overflow-hidden">
                {item.imagePath && (
                  <Image
                    src={item.imagePath}
                    alt={item.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                )}
              </div>

              <div className="flex flex-col bg-[#F2F2F2] px-[25px] py-[34px] gap-6 grow md:min-h-[314px]">
                <div className="flex flex-col gap-6 grow text-center md:text-left">
                  <h3 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.02em] leading-tight text-black">
                    {item.title}
                  </h3>
                  <p className="text-[18px] md:text-[22px] font-normal tracking-[-0.02em] leading-snug text-black">
                    {item.description}
                  </p>
                </div>

                <div className="w-full flex justify-center">
                  {item.buttonHref ? (
                    <Link href={item.buttonHref}>
                      <Button className="w-[142px] h-14 rounded-lg bg-[#388082] px-6 py-4 text-[20px] md:text-[22px] font-medium text-white hover:bg-[#2f6e70] transition-colors">
                        {item.buttonLabel || "More Info"}
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-[142px] h-14 rounded-lg bg-[#388082] px-6 py-4 text-[20px] md:text-[22px] font-medium text-white hover:bg-[#2f6e70] transition-colors">
                      {item.buttonLabel || "More Info"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Chef Amber Section */}
      <section
        className="relative w-full min-h-[700px] md:h-[764px] flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat md:bg-fixed"
        style={
          data.aboutImagePath
            ? { backgroundImage: `url(${JSON.stringify(data.aboutImagePath)})` }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative z-10 w-full bg-white/90 backdrop-blur-sm shadow-xl border-y border-white/20 py-10 md:py-14 flex justify-center">
          <div className="flex flex-col items-center w-full max-w-[810px] px-6 gap-8 md:gap-10">
            <div className="flex flex-col items-center w-full gap-6 md:gap-[37px]">
              <h2 className="text-[24px] md:text-[34px] font-semibold leading-tight tracking-[-0.02em] text-black text-center font-sans">
                {data.aboutHeading}
              </h2>

              <div className="flex flex-col gap-4 text-center max-w-full font-sans">
                <p className="text-[17px] md:text-[20px] leading-relaxed text-black">
                  {data.aboutBodyPrimary}
                </p>

                <p className="text-[17px] md:text-[20px] leading-relaxed text-[#7A7A7A]">
                  {data.aboutBodySecondary}
                </p>

                <p className="text-[17px] md:text-[20px] leading-relaxed text-[#7A7A7A]">
                  {data.aboutBodyTertiary}
                </p>
              </div>

              <div className="w-full flex justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full max-w-[650px]">
                  {data.aboutBullets.map((text, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3.5 p-3 border border-[#388082] rounded-lg
                     bg-white min-h-[50px]"
                    >
                      <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-md bg-[#388082] shrink-0">
                        <svg
                          className="w-3 h-3 md:w-4 md:h-4"
                          viewBox="0 0 18 21"
                          fill="none"
                        >
                          <path
                            d="M16.5 5.5L6.5 15.5L1.5 10.5"
                            stroke="#FFFFFF"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <span className="text-[14px] md:text-[16px] font-semibold text-[#388082] font-sans">
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link href={data.aboutButtonHref || "/about"}>
              <Button className="w-full max-w-[255px] h-12 md:h-14 rounded-lg bg-[#388082] text-[18px] md:text-[20px] font-medium text-white hover:brightness-110 transition-all active:scale-95">
                {data.aboutButtonLabel}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Recipes Section */}
      <section className="w-full py-10 md:py-12 bg-[#F4F4F4]">
        <div className="w-full max-w-[1246px] mx-auto px-6 lg:px-0 py-8 md:py-10">
          <div className="mx-auto mb-8 md:mb-10 flex max-w-[860px] flex-col items-center gap-3 text-center">
            <h2 className="text-[44px] md:text-[64px] text-black leading-[0.95] tracking-wide uppercase font-['Bebas_Neue']">
              {data.featuredHeading || "Featured Recipes"}
            </h2>
            <p className="text-[15px] md:text-[18px] leading-relaxed text-[#5B5B5B]">
              {data.featuredDescription ||
                "Explore handpicked recipes built for flavor, balance, and everyday simplicity."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 justify-items-center">
            {data.featuredRecipes.map((item: FeaturedRecipe) => {
              const rawCategorySlug = (item.slug || item.title || "")
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
              const normalizedTitleSlug = (item.title || "")
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
              const categorySlugAliases: Record<string, string> = {
                lunch: "pasta",
                dinner: "vegan",
              };
              const titleAliases: Record<string, string> = {
                lunch: "PASTA",
                dinner: "VEGAN",
              };
              const categorySlug =
                normalizedTitleSlug === "chef-spotlight"
                  ? "chef-spotlight"
                  : categorySlugAliases[rawCategorySlug] ?? rawCategorySlug;
              const displayTitle =
                titleAliases[rawCategorySlug] || item.title || "Recipe";
              const cardHref = categorySlug
                ? `/recipes?category=${encodeURIComponent(categorySlug)}`
                : "/recipes";

              return (
                <div
                  key={item.id}
                  className="relative w-full max-w-[292px] h-[356px] group overflow-hidden transition-all duration-300"
                >
                  <Link
                    href={cardHref}
                    className="block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#73B9C4]"
                  >
                    {item.imagePath && (
                      <Image
                        src={item.imagePath}
                        alt={item.title || displayTitle}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-[transform,filter] duration-500 group-hover:scale-105 group-hover:brightness-110"
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/40 to-black/70 transition-all duration-300 group-hover:from-black/35 group-hover:to-black/60" />

                    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                      <div className="flex flex-col items-center gap-4 w-full transition-transform duration-300 group-hover:-translate-y-4">
                        <h3 className="text-[48px] leading-[0.8] text-white uppercase tracking-wide font-['Bebas_Neue']">
                          {displayTitle}
                        </h3>
                        <div className="w-[150px] border-t border-white/90" />
                        <p className="text-[14px] md:text-[15px] text-white/90 leading-5 font-medium line-clamp-2 max-w-[220px]">
                          {item.description || "Click below to explore this recipe collection."}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[170px] h-10 border border-white/80 bg-white/10 rounded-md flex items-center justify-center py-2.5 px-3.5 text-white opacity-0 translate-y-2 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-hover:border-white group-hover:bg-white/20"
                      >
                        <span className="text-[13px] md:text-[14px] text-white text-center leading-5 uppercase tracking-[0.08em] font-semibold transition-colors duration-300 group-hover:text-white">
                          Click For More
                        </span>
                      </Button>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="relative w-full min-h-[650px] md:h-[619px] overflow-visible flex items-center justify-center py-12">
        {data.testimonialBackgroundPath && (
          <Image
            src={data.testimonialBackgroundPath}
            alt="Background"
            fill
            className="object-cover"
          />
        )}

        <div className="relative z-10 w-full max-w-[1252px] px-8 md:px-12">
          <Carousel
            setApi={setTestimonialApi}
            fade
            opts={{ align: "start", loop: true }}
            className="relative w-full"
          >
            <div className="hidden md:block absolute -top-8 -right-8 w-full h-full border-4 border-[#16B0B9] rounded-lg z-50 pointer-events-none" />

            <CarouselContent className="z-10">
              {data.testimonials.map((item: Testimonial) => (
                <CarouselItem key={item.id}>
                  <div className="w-full min-h-[450px] md:min-h-[409px] bg-white/85 backdrop-blur-[10px] shadow-lg flex items-center justify-center border border-white/20 rounded-lg p-6 md:p-12">
                    <div className="w-full max-w-[997px] flex flex-col items-center gap-6">
                      <h3
                        className="text-[24px] md:text-[30px] font-normal leading-tight tracking-tight text-[#5B5B5B] text-center uppercase"
                        style={{ fontFamily: "Royale Couture, sans-serif" }}
                      >
                        {item.title}
                      </h3>

                      <div className="flex flex-col items-center gap-6 w-full">
                        <p className="text-[16px] md:text-[22px] font-medium leading-relaxed text-[#5B5B5B] text-center italic font-sans">
                          {item.text}
                        </p>

                        <p className="text-[16px] md:text-[22px] font-bold text-[#5B5B5B] text-center font-sans">
                          {item.author}
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}

              {/* Dedicated Review Links Slide */}
              <CarouselItem key="review-links">
                <div className="w-full min-h-[450px] md:min-h-[409px] bg-white/85 backdrop-blur-[10px] shadow-lg flex items-center justify-center border border-white/20 rounded-lg p-6 md:p-12">
                  <div className="w-full max-w-[900px] flex flex-col items-center gap-8">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <h3
                        className="text-[24px] md:text-[32px] font-normal leading-tight tracking-tight text-[#5B5B5B] uppercase"
                        style={{ fontFamily: "Royale Couture, sans-serif" }}
                      >
                        Loved the experience?
                      </h3>
                      <p className="text-[15px] md:text-[18px] text-[#7a7a7a] font-sans">
                        Share your review and help others discover WaistLess Foods.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
                      <a
                        href="https://www.yelp.com/biz_photos/waistless-foods-houston-2"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-center gap-3 bg-[#388082] hover:bg-[#2d6b6d] active:scale-95 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 w-full sm:w-auto min-w-[200px] shadow-sm"
                      >
                        <Image
                          src="https://cdn.simpleicons.org/yelp/ffffff"
                          alt="Yelp"
                          width={24}
                          height={24}
                          className="h-6 w-6 shrink-0"
                        />
                        <span className="text-base md:text-lg">See more on Yelp</span>
                      </a>

                      <a
                        href="https://www.google.com/search?kgmid=/g/11yxy_rgvn&q=WaistLess+Foods"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-center gap-3 bg-[#388082] hover:bg-[#2d6b6d] active:scale-95 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 w-full sm:w-auto min-w-[200px] shadow-sm"
                      >
                        <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
                        </svg>
                        <span className="text-base md:text-lg">See more on Google</span>
                      </a>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>

            <CarouselPrevious
              appearance="brand"
              className="z-20 -left-6 top-1/2 -translate-y-1/2 md:-left-6"
            />
            <CarouselNext
              appearance="brand"
              className="z-20 -right-6 top-1/2 -translate-y-1/2 md:-right-6"
            />

            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-50">
              {[...data.testimonials, { id: "review-links" }].map((_, index) => (
                <button
                  key={index}
                  onClick={() => testimonialApi?.scrollTo(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    testimonialCurrent === index
                      ? "bg-[#16B0B9] scale-125"
                      : "bg-white/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </Carousel>
        </div>
      </section>
    </div>
  );
}
