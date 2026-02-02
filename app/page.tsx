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
import { Menu, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    onSelect();
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const featuredRecipes = [
    {
      title: "BREAKFAST",
      slug: "breakfast",
      image: "/featured/breakfast.png",
      desc: "Start your day with nourishing, flavor-packed dishes made from fresh, sustainable ingredients.",
    },
    {
      title: "LUNCH",
      slug: "lunch",
      image: "/featured/lunch.png",
      desc: "Light yet satisfying recipes perfect for a mid-day boost wholesome, colorful, and full of life.",
    },
    {
      title: "DINNER",
      slug: "dinner",
      image: "/featured/dinner.png",
      desc: "End your day with hearty, soulful meals crafted to bring comfort, balance, and joy to your table.",
    },
    {
      title: "DESSERT",
      slug: "dessert",
      image: "/featured/dessert.png",
      desc: "Sweet creations that satisfy your cravings while keeping things natural and mindful.",
    },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Header Navigation */}
      <header className="w-full bg-white">
        <div
          className="w-full h-[45px] flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: "#00676E", opacity: 1 }}
        >
          <span
            className="text-white uppercase tracking-normal"
            style={{
              fontFamily: "General Sans, sans-serif",
              fontWeight: 600,
              fontSize: "16px",
              lineHeight: "100%",
            }}
          >
            Promotion Here
          </span>
        </div>
        <div className="hidden lg:grid grid-cols-3 items-start px-12 py-5 w-full bg-white">
          <div className="relative w-28 h-28 justify-self-start">
            <Image
              src="/logo.png"
              alt="Waist Less Food Logo"
              width={119}
              height={119}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </div>

          <nav className="flex items-center gap-10 justify-self-center self-end">
            <a
              href="#"
              className="px-0 py-2 border-b border-[#09686E] text-[#09686E] font-semibold text-base uppercase"
            >
              Home
            </a>
            <a
              href="#"
              className="text-[#464646] font-semibold text-base uppercase"
            >
              About
            </a>
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="text-[#464646] font-semibold text-base uppercase">
                Chef Services
              </span>
              <svg
                className="w-6 h-6 rotate-180"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M7 10l5 5 5-5"
                  stroke="#464646"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <a
              href="#"
              className="text-[#464646] font-semibold text-base uppercase"
            >
              Recipes
            </a>
            <a
              href="#"
              className="text-[#464646] font-semibold text-base uppercase"
            >
              Gallery
            </a>
          </nav>

          <div className="flex flex-col items-end justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="default"
                size="sm"
                className="px-2 py-2 text-xs rounded-sm"
              >
                Complimentary Chef Consultation
              </Button>
              <div className="w-8 h-0 border border-[#19767C] rotate-90" />
              <div className="flex items-center gap-1.5">
                <a
                  href="#"
                  className="w-5 h-5 text-[#00676E]"
                  aria-label="Instagram"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-5 h-5 text-[#00676E]"
                  aria-label="Facebook"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-5 h-5 text-[#00676E]"
                  aria-label="Yelp"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.271 17.652c.276.342.616.496 1.03.496.413 0 .77-.154 1.03-.496l4.02-4.98c.275-.342.413-.703.413-1.084 0-.38-.138-.741-.413-1.083a1.484 1.484 0 0 0-1.03-.496h-8.04c-.414 0-.77.154-1.03.496-.276.342-.414.703-.414 1.083 0 .38.138.742.413 1.084l4.02 4.98z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="mt-7">
              <Button
                variant="outline"
                className="w-[117px] h-12 px-5 py-3 flex items-center justify-center gap-2 rounded-lg border bg-[#F9F8F8] text-[#464646] text-base font-semibold uppercase leading-none"
              >
                CART
                <ShoppingCart className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:hidden flex items-center justify-between px-4 py-3">
          <div className="relative w-16 h-16">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon">
              <ShoppingCart className="w-5 h-5" />
            </Button>

            <Button aria-label="Menu">
              <Menu />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full min-h-[700px] md:h-[707px] flex items-center justify-center overflow-hidden">
        <Image
          src="/hero.png"
          alt="Hero Background"
          fill
          className="object-cover"
          priority
        />

        <div className="absolute inset-0 bg-black/20 md:bg-transparent" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-[1200px] px-6 py-20">
          <div className="flex flex-col items-center gap-8 md:gap-12 max-w-[800px]">
            <div className="flex flex-col items-center gap-4 md:gap-6">
              <h1 className="text-5xl sm:text-7xl md:text-[100px] leading-[0.9] md:leading-tight tracking-wide uppercase text-white text-center font-['Bebas_Neue']">
                Waste Less.
                <br className="md:hidden" /> Taste More.
              </h1>

              <p className="text-lg md:text-[26px] leading-relaxed text-white text-center max-w-[600px]">
                Private Chef Amber curates fresh, flavorful meals, from
                pescatarian feasts to hearty family dinners, with an
                eco-conscious touch.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button
                size="lg"
                className="px-6 py-4 text-lg md:text-xl h-auto w-full sm:w-auto"
              >
                Book a Private Experience
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-6 py-4 border-2 border-white bg-transparent text-white text-lg md:text-xl h-auto hover:bg-white/10 w-full sm:w-auto"
              >
                View Services
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 md:px-28 py-20 bg-white space-y-10 md:space-y-[78px]">
        <div className="flex flex-col items-center gap-6 max-w-[1222px] mx-auto text-center">
          <h2 className="text-[32px] md:text-[44px] font-medium tracking-[-0.02em] text-black leading-tight">
            SIMPLE. SUSTAINABLE. DELICIOUS.
          </h2>
          <p className="max-w-[900px] text-[18px] md:text-[30px] tracking-[-0.02em] leading-relaxed md:leading-[34px] text-[#838383]">
            We make healthy, eco-conscious eating easy for everyone. Discover
            recipes and habits that taste as good as they feel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[31px] max-w-[1222px] mx-auto">
          {[
            {
              title: "RECIPES FOR EVERY MOOD",
              desc: "Find delicious inspiration for every occasion — from quick bites to weekend-worthy meals.",
              img: "/highlight/recipe.png",
            },
            {
              title: "ECO LIVING TIPS",
              desc: "Learn simple, sustainable habits to make your kitchen and home more eco-friendly.",
              img: "/highlight/eco-living.png",
            },
            {
              title: "MEET CHEF AMBER",
              desc: "Discover Chef Amber's story, her cooking philosophy, and the passion behind every flavorful dish.",
              img: "/highlight/meet-chef.png",
            },
          ].map((item, index) => (
            <div key={index} className="flex flex-col w-full h-full">
              <div className="relative w-full aspect-387/257">
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col bg-[#F2F2F2] px-[25px] py-[34px] gap-6 grow md:min-h-[314px]">
                <div className="flex flex-col gap-6 grow text-center md:text-left">
                  <h3 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.02em] leading-tight text-black">
                    {item.title}
                  </h3>
                  <p className="text-[18px] md:text-[22px] font-normal tracking-[-0.02em] leading-snug text-black">
                    {item.desc}
                  </p>
                </div>

                <div className="w-full flex justify-center">
                  <Button className="w-[142px] h-14 rounded-lg bg-[#388082] px-6 py-4 text-[20px] md:text-[22px] font-medium text-white hover:bg-[#2f6e70] transition-colors">
                    More Info
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Chef Amber Section */}
      <section
        className="relative w-full min-h-[700px] md:h-[764px] flex items-center justify-center overflow-hidden bg-fixed bg-center bg-cover"
        style={{
          backgroundImage: "url('/highlight/amber-chef.png')",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative z-10 w-full bg-white/90 backdrop-blur-sm shadow-xl border-y border-white/20 py-10 md:py-14 flex justify-center">
          <div className="flex flex-col items-center w-full max-w-[810px] px-6 gap-8 md:gap-10">
            <div className="flex flex-col items-center w-full gap-6 md:gap-[37px]">
              <h2 className="text-[24px] md:text-[34px] font-semibold leading-tight tracking-[-0.02em] text-black text-center font-sans">
                ABOUT CHEF AMBER
              </h2>

              <div className="flex flex-col gap-4 text-center max-w-full font-sans">
                <p className="text-[17px] md:text-[20px] leading-relaxed text-black">
                  <span className="font-semibold">Chef Amber </span>
                  <span className="font-normal">
                    is the creative force behind{" "}
                  </span>
                  <span className="font-semibold">WaistLess Foods, </span>
                  <span className="font-normal">
                    blending flavor, sustainability, and heart into every dish
                    she makes.
                  </span>
                </p>

                <p className="text-[17px] md:text-[20px] leading-relaxed text-[#7A7A7A]">
                  As a Houston-based private chef, Amber transforms everyday
                  ingredients into soulful, nourishing meals designed to make
                  healthy eating effortless and enjoyable.
                </p>

                <p className="text-[17px] md:text-[20px] leading-relaxed text-[#7A7A7A]">
                  Her journey began cooking for her family of four — now it’s
                  her mission to show that mindful cooking can be both exciting
                  and full of love.
                </p>
              </div>

              <div className="w-full flex justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full max-w-[650px]">
                  {[
                    "Sustainable Cooking",
                    "Flavor-Driven Recipes",
                    "Family-Inspired Meals",
                    "Always Made with Care",
                  ].map((text, index) => (
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

            <Button className="w-full max-w-[255px] h-12 md:h-14 rounded-lg bg-[#388082] text-[18px] md:text-[20px] font-medium text-white hover:brightness-110 transition-all active:scale-95">
              Meet Chef Amber
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Recipes Section */}
      <section className="w-full max-w-[1246px] mx-auto px-6 lg:px-0 py-20 bg-white">
        <h2 className="text-[50px] md:text-[80px] font-semibold text-black text-center mb-14 tracking-[-0.02em] leading-[86px] font-[family-name:--font-schibsted)]">
          Featured Recipes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[26px] justify-items-center">
          {featuredRecipes.map((item) => (
            <div
              key={item.slug}
              className="relative w-full max-w-[292px] h-[369px] group overflow-hidden"
            >
              <Link href={`/recipes/${item.slug}`}>
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-black/60 transition-all duration-300 group-hover:bg-black/25" />

                <div className="absolute top-[67px] left-1/2 -translate-x-1/2 w-[183px] h-[235px] flex flex-col items-center justify-between">
                  <div className="flex flex-col items-center gap-5 w-full shrink-0">
                    <h3 className="text-[55.88px] text-white text-center uppercase tracking-[-0.02em] font-(family-name:--font-bebas-neue) leading-[38px] font-normal">
                      {item.title}
                    </h3>
                    <div className="w-[161px] border-t border-white" />
                  </div>

                  <div className="flex items-center grow">
                    <p className="text-[16px] text-white text-center font-medium tracking-[-0.02em] leading-5 font-sans">
                      {item.desc}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-[170px] h-10 shrink-0 border border-white bg-transparent rounded-lg flex items-center justify-center py-2.5 px-3.5 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-white/10 text-white"
                  >
                    <span className="text-[16px] text-white text-center leading-5 uppercase font-sans">
                      CLICK FOR MORE
                    </span>
                  </Button>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="relative w-full min-h-[650px] md:h-[619px] overflow-visible flex items-center justify-center py-12">
        <Image
          src="/testimonial.png"
          alt="Background"
          fill
          className="object-cover"
        />

        <div className="relative z-10 w-full max-w-[1252px] px-8 md:px-12">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true }}
            className="relative w-full"
          >
            <div className="hidden md:block absolute -top-8 -right-8 w-full h-full border-4 border-[#16B0B9] rounded-xl z-50 pointer-events-none" />

            <CarouselContent className="z-10">
              {[
                {
                  title: "COOKING CLASS",
                  text: "“ I’m a realtor and I hired Chef Amber to help me bring a unique idea to life. A cooking class attached to a finance class. Sounds crazy but everyone loved it. They appreciated the gems she dropped, her made from scratch sauces and her personality. At one point the room filled with 20+ people was dead silent. Now you know when people are silent and they are eating that means the food is good! I can’t wait to work with her again. ”",
                  author: "-Lisa Barnes, J. Barnes Realty-",
                },
                {
                  title: "PRIVATE DINING",
                  text: "“ Chef Amber provided an exceptional dining experience for our anniversary. The attention to detail and the fusion of flavors was unlike anything we've had before. Highly recommend! ”",
                  author: "-Michael & Sarah J.-",
                },
                {
                  title: "MEAL PREP",
                  text: "“ Her meal prep service has changed my life. Eating healthy has never been this easy and delicious. Each dish feels like it was made with so much care and soul. ”",
                  author: "-David Wilson-",
                },
              ].map((item, index) => (
                <CarouselItem key={index}>
                  <div className="w-full min-h-[450px] md:min-h-[409px] bg-white/85 backdrop-blur-[10px] shadow-lg flex items-center justify-center border border-white/20 rounded-xl p-6 md:p-12">
                    <div className="w-full max-w-[997px] flex flex-col items-center gap-6">
                      <h3
                        className="text-[24px] md:text-[30px] font-normal leading-tight tracking-tight text-[#5B5B5B] text-center uppercase"
                        style={{ fontFamily: "Royale Couture, sans-serif" }}
                      >
                        {item.title}
                      </h3>

                      <div className="flex flex-col items-center gap-6 w-full">
                        <p
                          className="text-[16px] md:text-[22px] font-medium leading-relaxed text-[#5B5B5B] text-center italic"
                          style={{ fontFamily: "Metropolis, sans-serif" }}
                        >
                          {item.text}
                        </p>

                        <p
                          className="text-[16px] md:text-[22px] font-bold text-[#5B5B5B] text-center"
                          style={{ fontFamily: "Metropolis, sans-serif" }}
                        >
                          {item.author}
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 w-10 h-10 md:w-[70px] md:h-[70px] bg-[#0F8DAB] hover:bg-[#0c768f] border-0 rounded-full z-40 shadow-xl opacity-100! flex items-center justify-center [&_svg]:text-white [&_svg]:w-3.5 [&_svg]:h-4 md:[&_svg]:w-[21.16px] md:[&_svg]:h-[24.69px] [&_svg]:stroke-[3.53px]" />
            <CarouselNext className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 w-10 h-10 md:w-[70px] md:h-[70px] bg-[#0F8DAB] hover:bg-[#0c768f] border-0 rounded-full z-40 shadow-xl opacity-100! flex items-center justify-center [&_svg]:text-white [&_svg]:w-3.5 [&_svg]:h-4 md:[&_svg]:w-[21.16px] md:[&_svg]:h-[24.69px] [&_svg]:stroke-[3.53px]" />

            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-50">
              {["COOKING CLASS", "PRIVATE DINING", "MEAL PREP"].map(
                (_, index) => (
                  <button
                    key={index}
                    onClick={() => api?.scrollTo(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      current === index
                        ? "bg-[#16B0B9] scale-125"
                        : "bg-white/50"
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ),
              )}
            </div>
          </Carousel>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-14 py-18 bg-[#00676E]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-8">
            {/* Brand & Newsletter */}
            <div className="flex flex-col gap-6 max-w-md">
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl text-white font-['Danegren']">
                  WaistLess Foods
                </h3>
                <p className="text-base text-white">
                  Eat well. Live bright. Waste less. 🌿
                </p>
              </div>

              <div className="flex items-center justify-between px-4 py-4 bg-white rounded">
                <input
                  type="email"
                  placeholder="Enter Your Email"
                  className="flex-1 text-base text-gray-500 bg-transparent outline-none"
                />
                <Button className="px-4 py-2.5 rounded-xl font-semibold h-auto">
                  Subscribe
                </Button>
              </div>
            </div>

            <div className="flex gap-10">
              <div className="flex flex-col gap-4">
                <h4 className="text-lg font-medium text-white">Quick Menu</h4>
                <div className="flex flex-col gap-4">
                  {[
                    "Home",
                    "Meet Chef Amber",
                    "Recipes & Lifestyle",
                    "Blog",
                  ].map((link) => (
                    <a
                      key={link}
                      href="#"
                      className="text-base font-semibold text-white hover:text-white/80 transition"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="text-lg font-medium text-white">Licence</h4>
                <div className="flex flex-col gap-4">
                  {["Privacy Policy", "Copyright", "Term & Condition"].map(
                    (link) => (
                      <a
                        key={link}
                        href="#"
                        className="text-base font-semibold text-white hover:text-white/80 transition"
                      >
                        {link}
                      </a>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mb-8" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              {["instagram", "facebook", "yelp"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
                  aria-label={social}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                    {social === "instagram" && (
                      <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                    )}
                    {social === "facebook" && (
                      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
                    )}
                    {social === "yelp" && (
                      <path d="M12.271 17.652c.276.342.616.496 1.03.496.413 0 .77-.154 1.03-.496l4.02-4.98c.275-.342.413-.703.413-1.084 0-.38-.138-.741-.413-1.083a1.484 1.484 0 0 0-1.03-.496h-8.04c-.414 0-.77.154-1.03.496-.276.342-.414.703-.414 1.083 0 .38.138.742.413 1.084l4.02 4.98z" />
                    )}
                  </svg>
                </a>
              ))}
            </div>

            <p className="text-xs text-white">
              © 2025 Amber. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
