"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useState } from "react";
import Image from "next/image";
import { getIconPath } from "@/lib/social-links";
import type { SocialLink } from "@/lib/contentful-links";
import type { FooterSettings } from "@/lib/contentful-management";
import Link from "next/link";

type FooterProps = {
  socialLinks?: SocialLink[];
  footerSettings?: FooterSettings | null;
};

const DEFAULT_BRAND_DESCRIPTION =
  "Nourishing recipes and practical wellness support for your healthy lifestyle.";
const DEFAULT_NEWSLETTER_DESCRIPTION =
  "Get recipes, product updates, and wellness tips straight to your inbox.";
const DEFAULT_QUICK_MENU_DESCRIPTION = "Explore our most visited pages.";
const DEFAULT_FOLLOW_US_DESCRIPTION = "Stay connected for daily inspiration.";

const QUICK_MENU_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Chef Services" },
  { href: "/shop", label: "Shop" },
  { href: "/recipes", label: "Recipes" },
  { href: "/blog", label: "Blog" },
  { href: "/links", label: "Links" },
];

export default function Footer({ socialLinks = [], footerSettings }: FooterProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  const brandDescription =
    footerSettings?.brandDescription || DEFAULT_BRAND_DESCRIPTION;
  const newsletterDescription =
    footerSettings?.newsletterDescription || DEFAULT_NEWSLETTER_DESCRIPTION;
  const quickMenuDescription =
    footerSettings?.quickMenuDescription || DEFAULT_QUICK_MENU_DESCRIPTION;
  const followUsDescription =
    footerSettings?.followUsDescription || DEFAULT_FOLLOW_US_DESCRIPTION;

  const isFacebookLink = (social: SocialLink) => {
    const value = `${social.title} ${social.icon} ${social.href}`.toLowerCase();
    return value.includes("facebook");
  };

  const isTikTokLink = (social: SocialLink) => {
    const value = `${social.title} ${social.icon} ${social.href}`.toLowerCase();
    return value.includes("tiktok") || social.icon === "Music";
  };

  const fallbackTikTokLink: SocialLink = {
    title: "TikTok",
    href: "https://www.tiktok.com/@waistlessfoods",
    icon: "Music",
  };

  const footerSocialLinks = (() => {
    const withoutFacebook = socialLinks.filter((social) => !isFacebookLink(social));

    if (withoutFacebook.some(isTikTokLink)) {
      return withoutFacebook;
    }

    if (socialLinks.some(isFacebookLink)) {
      return [...withoutFacebook, fallbackTikTokLink];
    }

    return withoutFacebook;
  })();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setMessageType(null);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Something went wrong. Please try again.");
        setMessageType("error");
        return;
      }

      setMessage("Thank you for subscribing!");
      setMessageType("success");
      setEmail("");
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="relative overflow-hidden bg-[#00676E] py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.14),transparent_38%),radial-gradient(circle_at_90%_90%,rgba(255,255,255,0.1),transparent_42%)]" />
      <Container>
        <div className="relative z-10 px-2 py-2 sm:px-0 sm:py-0">
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:items-start">
            <div className="flex flex-col gap-6">
              <h3 className="text-3xl font-semibold tracking-tight text-white">WaistLess Foods</h3>
              <p className="max-w-xl text-base leading-7 text-white/90">{brandDescription}</p>
              <p className="max-w-xl text-sm leading-7 text-white/80">{newsletterDescription}</p>

              <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 rounded-xl border border-white/25 bg-white p-2 sm:flex-row sm:items-center">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="h-11 flex-1 rounded-md border border-transparent px-4 text-[#0A4E53] outline-none transition focus:border-[#00676E]/40 focus:bg-[#f8ffff]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 rounded-md bg-[#00676E] px-6 text-white hover:bg-[#055a60]"
                  >
                    {isSubmitting ? "Subscribing..." : "Subscribe"}
                  </Button>
                </div>
                {message && (
                  <p
                    className={`text-sm ${
                      messageType === "error" ? "text-red-200" : "text-emerald-200"
                    }`}
                  >
                    {message}
                  </p>
                )}
              </form>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                Quick Menu
              </h4>
              <p className="mb-5 max-w-xs text-sm leading-6 text-white/80">{quickMenuDescription}</p>
              <nav className="space-y-2">
                {QUICK_MENU_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block w-fit text-base text-white/95 transition hover:translate-x-1 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                Follow Us
              </h4>
              <p className="mb-5 max-w-xs text-sm leading-6 text-white/80">{followUsDescription}</p>
              <div className="flex flex-col gap-2">
                {footerSocialLinks.map((social) => (
                  <a
                    key={social.title}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-fit items-center gap-2 rounded-md px-2 py-1 text-white/95 transition hover:bg-white/10 hover:text-white"
                  >
                    <Image
                      alt={social.title}
                      width={18}
                      height={18}
                      src={getIconPath(social.icon)}
                      className="brightness-0 invert"
                    />
                    <span className="text-sm">{social.title}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-10 border-t border-white/15 pt-6 text-center text-sm text-white/75">
            © {new Date().getFullYear()} waistlessfoods.com. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
