import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Menu, ShoppingCart } from "lucide-react";
import Image from "next/image";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import Link from "next/link";

export default async function ServicesPage() {
  const services = [
    {
      title: "Private Service",
      description: "A personalized dining experience crafted to your taste.",
      benefits: [
        "Custom menus",
        "Fresh, quality ingredients",
        "Stress-free hosting",
        "Beautiful presentation",
        "Private, elevated experience",
      ],
      image: "/services/img-1.png",
    },
    {
      title: "Catering",
      description: "Delicious, thoughtfully prepared food for any occasion.",
      benefits: [
        "Event-tailored menus",
        "Fresh, vibrant dishes",
        "Eco-friendly prep",
        "Smooth, reliable service",
        "Ideal for parties & corporate events",
      ],
      image: "/services/img-2.png",
    },
    {
      title: "Cooking Class",
      description: "Learn to cook fresh, flavorful meals with confidence.",
      benefits: [
        "Beginner-friendly lessons",
        "Waste-reducing tips",
        "Easy-to-repeat recipes",
        "Fun group experience",
        "Taught by a professional chef",
      ],
      image: "/services/img-3.png",
    },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Header Navigation */}
      <header className="w-full bg-white">
        {/* Top Promotion Bar */}
        <div className="w-full h-[45px] flex items-center justify-center bg-[#00676E]">
          <span className="text-white uppercase text-[16px] font-semibold font-sans">
            Promotion Here
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:grid grid-cols-3 items-start px-12 py-5 w-full bg-white">
          {/* Logo */}
          <div className="relative w-28 h-28 justify-self-start">
            <Image
              src="/logo.png"
              alt="Logo"
              width={119}
              height={119}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </div>

          {/* Center Nav */}
          <div className="justify-self-center self-end pb-2">
            <NavigationMenu>
              <NavigationMenuList className="gap-10">
                <NavigationMenuItem>
                  <Link
                    href="/"
                    className="px-0 py-2 border-b border-[#09686E] text-[#09686E] font-semibold text-base uppercase font-sans"
                  >
                    Home
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    href="/about"
                    className="text-[#464646] font-semibold text-base uppercase font-sans hover:text-[#09686E]"
                  >
                    About
                  </Link>
                </NavigationMenuItem>

                {/* Chef Services Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-auto p-0 bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent!">
                    <span className="text-[#464646] font-semibold text-base uppercase font-sans group-data-[state=open]:text-[#09686E]">
                      Chef Services
                    </span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-60 p-0 bg-white rounded-md">
                      <li>
                        <NavigationMenuLink asChild>
                          <a
                            href="#private"
                            className="block p-3 text-sm font-medium text-[#464646] hover:bg-[#F4F4F4] hover:text-[#00676E] rounded-md font-sans"
                          >
                            Private Service
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <a
                            href="#catering"
                            className="block p-3 text-sm font-medium text-[#464646] hover:bg-[#F4F4F4] hover:text-[#00676E] rounded-md font-sans"
                          >
                            Catering
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <a
                            href="#class"
                            className="block p-3 text-sm font-medium text-[#464646] hover:bg-[#F4F4F4] hover:text-[#00676E] rounded-md font-sans"
                          >
                            Cooking Class
                          </a>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    href="/recipes"
                    className="text-[#464646] font-semibold text-base uppercase font-sans hover:text-[#09686E]"
                  >
                    Recipes
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    href="/gallery"
                    className="text-[#464646] font-semibold text-base uppercase font-sans hover:text-[#09686E]"
                  >
                    Gallery
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Actions */}
          <div className="flex flex-col items-end justify-between h-full">
            <div className="flex items-center gap-6">
              <Button
                size="sm"
                className="px-4 py-2 text-xs rounded-sm font-sans font-semibold"
              >
                Complimentary Chef Consultation
              </Button>
              <div className="w-8 h-0 border border-[#19767C] rotate-90" />
              <div className="flex items-center gap-2 text-[#00676E]">
                <Instagram className="w-5 h-5 cursor-pointer" />
                <Facebook className="w-5 h-5 cursor-pointer" />
              </div>
            </div>

            <div className="mt-7">
              <Button
                variant="outline"
                className="px-6 h-12 gap-3 rounded-lg border bg-[#F9F8F8] text-[#464646] font-bold font-sans"
              >
                CART
                <ShoppingCart className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b">
          <div className="relative w-16 h-16">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-[#00676E]" />
            <Menu className="w-8 h-8 text-[#00676E]" />
          </div>
        </div>
      </header>

      {/* Our Services Section */}
      <section className="bg-white py-[50px] px-6 md:px-[62px]">
        <div className="max-w-[1315px] mx-auto">
          <h2 className="font-[--font-bebas-neue] text-[80px] font-normal leading-[85.37px] tracking-[0.01em] uppercase text-black text-center mb-[60px] align-bottom">
            Our Service
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-10 lg:gap-5">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-[#F4F4F4] rounded-[12px] p-5 md:p-10 lg:p-[41px_20px] flex flex-col justify-between min-h-[874px] gap-9"
              >
                <div className="flex flex-col gap-9">
                  <div className="flex flex-col gap-[30px]">
                    <h3 className="font-[family-name:var(--sans font-semibold text-[32px] md:text-[44px] leading-tight md:leading-12 tracking-[-0.02em] text-black">
                      {service.title}
                    </h3>
                    <p className="font-[family-name:var(--sans font-medium text-[18px] md:text-[22px] leading-relaxed md:leading-7 tracking-[-0.02em] text-black">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-9">
                    <span className="font-[family-name:var(--sans font-bold text-[20px] md:text-[22px] leading-7 tracking-[-0.02em] text-[#6E6E6E]">
                      Benefits:
                    </span>
                    <ul className="list-disc pl-5 flex flex-col gap-2">
                      {service.benefits.map((benefit, idx) => (
                        <li
                          key={idx}
                          className="font-[family-name:var(--sans font-medium text-[18px] md:text-[20px] leading-relaxed tracking-[-0.02em] text-[#6E6E6E]"
                        >
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button className="w-full h-[52px] border border-[#00676E] bg-white rounded-[6px] font-sans font-bold text-[18px] uppercase tracking-wide text-[#00676E] transition-all hover:bg-[#00676E] hover:text-white active:scale-[0.97]">
                    Learn More
                  </Button>
                </div>

                <div className="relative w-full h-[289px] overflow-hidden rounded-[12px]">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-110"
                  />
                </div>
              </div>
            ))}
          </div>
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
