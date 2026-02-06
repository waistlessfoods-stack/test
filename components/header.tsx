"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, ChevronDown, X } from "lucide-react";
import Link from "next/link";

const services = [
  { label: "Private Service", href: "/services/private" },
  { label: "Catering", href: "/services/catering" },
  { label: "Cooking Class", href: "/services/cooking-class" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/", active: true },
    { label: "About", href: "/about" },
    { label: "Shop", href: "/shop" },
    { label: "Recipes", href: "/recipes" },
    { label: "Gallery", href: "/gallery" },
  ];

  return (
    <header className="w-full bg-white relative z-50">
      {/* Banner */}
      <div className="w-full h-[45px] flex items-center justify-center bg-[#00676E]">
        <span className="text-white uppercase text-[16px] font-semibold">
          Promotion Here
        </span>
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden lg:flex items-center px-12 py-5 w-full">
        <div className="flex-1 flex justify-start">
          <div className="relative w-28 h-28">
            <Image
              src="/logo.png"
              alt="Logo"
              width={119}
              height={119}
              className="absolute left-0 top-1/2 -translate-y-1/2"
            />
          </div>
        </div>

        <nav className="flex justify-center">
          <ul className="flex items-center gap-10">
            {navLinks.slice(0, 2).map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${
                    link.active
                      ? "border-b border-[#09686E] text-[#09686E]"
                      : "text-[#464646]"
                  } font-semibold uppercase hover:text-[#09686E] transition-colors`}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            <li
              className="relative group"
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <Link
                href="/services"
                className="flex items-center gap-1 text-[#464646] font-semibold uppercase group-hover:text-[#09686E] transition-colors"
              >
                Chef Services
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </Link>

              {isOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 w-60 z-60">
                  <ul className="bg-white border border-slate-100 rounded-md shadow-xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {services.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="block w-full px-5 py-3 text-sm font-medium text-[#464646] hover:bg-[#00676E] hover:text-white transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>

            {navLinks.slice(2).map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[#464646] font-semibold uppercase hover:text-[#09686E] transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 flex flex-col items-end gap-6">
          <div className="flex items-center gap-6">
            <Button
              size="sm"
              className="bg-[#00676E] hover:bg-[#00575e] text-white whitespace-nowrap"
            >
              Complimentary Chef Consultation
            </Button>
            <div className="flex items-center gap-6">
              <div className="h-8 w-px bg-[#19767C] shrink-0" />
              <div className="flex items-center gap-4">
                <Image alt="IG" width={24} height={24} src={"/IG.svg"} />
                <Image alt="FB" width={24} height={24} src={"/FB.svg"} />
                <Image alt="STAR" width={24} height={24} src={"/STAR.svg"} />
              </div>
            </div>
          </div>
          <div className="pr-12">
            <Button variant="outline" className="gap-2 bg-[#F9F8F8] font-bold">
              CART
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* MOBILE VIEW */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-white relative z-100">
        <div className="relative w-16 h-16">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" />
        </div>
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-[#00676E]" />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? (
              <X className="w-8 h-8 text-[#00676E]" />
            ) : (
              <Menu className="w-8 h-8 text-[#00676E]" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[110px] bg-white z-90 animate-in slide-in-from-right duration-300">
          <nav className="flex flex-col p-6 gap-6 h-full overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xl font-bold uppercase text-[#464646] border-b pb-2"
              >
                {link.label}
              </Link>
            ))}

            <div className="flex flex-col gap-4">
              <Link
                href={"/services"}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-xl font-bold uppercase text-[#00676E]">
                  Chef Services
                </span>
              </Link>
              <div className="pl-4 flex flex-col gap-4 border-l-2 border-[#00676E]">
                {services.map((service) => (
                  <Link
                    key={service.href}
                    href={service.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-medium text-[#464646]"
                  >
                    {service.label}
                  </Link>
                ))}
              </div>
            </div>

            <Button className="bg-[#00676E] w-full mt-4 py-6 text-lg uppercase">
              Consultation
            </Button>

            <div className="flex justify-center gap-8 mt-auto pb-10">
              <Image alt="IG" width={32} height={32} src={"/IG.svg"} />
              <Image alt="FB" width={32} height={32} src={"/FB.svg"} />
              <Image alt="STAR" width={32} height={32} src={"/STAR.svg"} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
