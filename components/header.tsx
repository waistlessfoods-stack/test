"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Menu, ShoppingCart } from "lucide-react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";

const services = [
  { label: "Private Service", href: "/services/private" },
  { label: "Catering", href: "/services/catering" },
  { label: "Cooking Class", href: "/services/cooking-class" },
];

const Header = () => {
  return (
    <header className="w-full bg-white relative z-50">
      <div className="w-full h-[45px] flex items-center justify-center bg-[#00676E]">
        <span className="text-white uppercase text-[16px] font-semibold">
          Promotion Here
        </span>
      </div>

      <div className="hidden lg:flex justify-between items-start px-12 py-5 w-full">
        <div className="relative w-28 h-28">
          <Image
            src="/logo.png"
            alt="Logo"
            width={119}
            height={119}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          />
        </div>

        <div className="relative flex items-end pb-2">
          <NavigationMenu>
            <NavigationMenuList className="gap-10">
              <NavigationMenuItem>
                <Link
                  href="/"
                  className="border-b border-[#09686E] text-[#09686E] font-semibold uppercase"
                >
                  Home
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link
                  href="/about"
                  className="text-[#464646] font-semibold uppercase hover:text-[#09686E]"
                >
                  About
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-auto p-0 bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent">
                  <Link
                    href="/services"
                    className="text-[#464646] font-semibold uppercase hover:text-[#09686E]"
                  >
                    Chef Services
                  </Link>
                </NavigationMenuTrigger>

                <NavigationMenuContent>
                  <ul className="w-60">
                    {services.map((item) => (
                      <li key={item.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className="block w-full px-4 py-3 hover:bg-[#00676E] hover:text-white transition"
                          >
                            {item.label}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link
                  href="/recipes"
                  className="text-[#464646] font-semibold uppercase hover:text-[#09686E]"
                >
                  Recipes
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link
                  href="/gallery"
                  className="text-[#464646] font-semibold uppercase hover:text-[#09686E]"
                >
                  Gallery
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>

            <NavigationMenuViewport />
          </NavigationMenu>
        </div>

        <div className="flex flex-col items-end gap-6">
          <div className="flex items-center gap-4">
            <Button size="sm">Complimentary Chef Consultation</Button>

            <div className="flex gap-2 text-[#00676E]">
              <Instagram className="w-5 h-5 cursor-pointer" />
              <Facebook className="w-5 h-5 cursor-pointer" />
            </div>
          </div>

          <Button variant="outline" className="gap-2 bg-[#F9F8F8] font-bold">
            CART
            <ShoppingCart className="w-5 h-5" />
          </Button>
        </div>
      </div>

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
  );
};

export default Header;
