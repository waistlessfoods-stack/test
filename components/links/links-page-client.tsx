"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Instagram,
  Facebook,
  Mail,
  MapPin,
  Music,
  Phone,
  Star,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import EnquiryDialog from "@/components/enquiry-dialog";

// Icon map for dynamic icon rendering
const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  ChefHat: () => <span className="h-5 w-5">👨‍🍳</span>,
  Utensils: () => <span className="h-5 w-5">🍽️</span>,
  Users: () => <span className="h-5 w-5">👥</span>,
  Crown: () => <span className="h-5 w-5">👑</span>,
  BookOpen: () => <span className="h-5 w-5">📖</span>,
  Instagram,
  Facebook,
  Music,
  MapPin,
  Star,
  Phone,
  Mail,
};

type IconType = ComponentType<{ className?: string }>;

interface LinkData {
  title: string;
  description: string;
  href: string;
  highlight: boolean;
  iconName: string;
  hidden?: boolean;
}

interface SocialLinkData {
  title: string;
  href: string;
  iconName: string;
}

interface ProfileData {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  image: string;
}

function trackLink(title: string, section: string, href: string) {
  if (typeof window === "undefined") return;

  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") {
    const dataLayer = (
      window as Window & { dataLayer?: Record<string, unknown>[] }
    ).dataLayer;

    if (Array.isArray(dataLayer)) {
      dataLayer.push({
        event: "link_click",
        link_title: title,
        link_section: section,
        link_url: href,
      });
    }
    return;
  }

  gtag("event", "link_click", {
    link_title: title,
    link_section: section,
    link_url: href,
  });
}

function addUtmParams(href: string, campaign: string) {
  if (!href.startsWith("http")) return href;

  try {
    const url = new URL(href);
    url.searchParams.set("utm_source", "waistlessfoods");
    url.searchParams.set("utm_medium", "links");
    url.searchParams.set("utm_campaign", campaign);
    return url.toString();
  } catch {
    return href;
  }
}

function ActionLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const isInternal = href.startsWith("/");
  const isExternal = href.startsWith("http");

  if (isInternal) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
      onClick={onClick}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

export default function LinksPageClient({
  profile,
  conferenceHeading,
  conferenceSubheading,
  primaryLinks,
  socialLinks,
  footerText,
}: {
  profile: ProfileData;
  conferenceHeading: string;
  conferenceSubheading: string;
  primaryLinks: LinkData[];
  socialLinks: SocialLinkData[];
  footerText: string;
}) {
  const searchParams = useSearchParams();
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const qrCampaign = "conference-2026";
  const isQr =
    searchParams.get("qr") === "1" ||
    searchParams.get("utm_campaign") === qrCampaign;
  const campaign = isQr ? qrCampaign : "links";
  return (
    <main className="relative min-h-screen bg-[#f6f4f0] text-[#1b1b1b]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#e1f1f0] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 translate-x-1/4 rounded-full bg-[#fff2e3] blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 pb-20 pt-14">
        <section className="rounded-3xl border border-[#d7e3e2] bg-white/90 p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-xl">
              <Image
                src={profile.image}
                alt="Chef Amber"
                fill
                className="object-cover object-center"
                sizes="112px"
                priority
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.35em] text-[#5b6b69]">
                WaistLess Foods
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-[#0e2f31]">
                {profile.name}
              </h1>
              <p className="text-lg font-medium text-[#0f3b3d]">
                {profile.tagline}
              </p>
              <p className="text-sm leading-relaxed text-[#5b6b69]">
                {profile.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <ActionLink
                href={`tel:${profile.phone.replace(/[^0-9]/g, "")}`}
                className="rounded-full border border-[#0f6f73] px-4 py-2 text-sm font-semibold text-[#0f6f73] transition hover:bg-[#0f6f73] hover:text-white"
                onClick={() =>
                  trackLink("Phone", "profile", `tel:${profile.phone}`)
                }
              >
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {profile.phone}
                </span>
              </ActionLink>
              <ActionLink
                href={`mailto:${profile.email}`}
                className="rounded-full border border-[#0f6f73] px-4 py-2 text-sm font-semibold text-[#0f6f73] transition hover:bg-[#0f6f73] hover:text-white"
                onClick={() =>
                  trackLink("Email", "profile", `mailto:${profile.email}`)
                }
              >
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </span>
              </ActionLink>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#0f6f73]/30 bg-[#0f6f73] px-5 py-4 text-white shadow-lg">
          <button
            onClick={() => {
              setOpenDialog("blog");
              trackLink("Conference Blog", "conference", "conference-blog");
            }}
            className="w-full flex flex-col gap-1 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded text-left"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">
              {conferenceHeading}
            </p>
            <p className="text-lg font-semibold">
              {conferenceSubheading}
            </p>
          </button>
        </section>

        <section className="flex flex-col gap-4">
          {primaryLinks.filter(link => !link.hidden).map((link) => {
            const IconComponent = iconMap[link.iconName] as IconType | undefined;
            const trackedHref = addUtmParams(link.href, campaign);
            
            // Determine if this link should open a dialog
            const isPrivateChef = link.title === "Book Private Chef";
            const isCookingClass = link.title === "Cooking Classes";
            const isDialogLink = isPrivateChef || isCookingClass;

            const handleClick = () => {
              if (isPrivateChef) {
                setOpenDialog("private_chef");
                trackLink(link.title, "primary", "private-chef-dialog");
              } else if (isCookingClass) {
                setOpenDialog("cooking_class");
                trackLink(link.title, "primary", "cooking-class-dialog");
              } else {
                trackLink(link.title, "primary", trackedHref);
              }
            };

            return isDialogLink ? (
              <button
                key={link.title}
                onClick={handleClick}
                className={`group flex flex-col gap-2 rounded-2xl border px-5 py-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6f73]/60 text-left ${
                  link.highlight
                    ? "border-[#0f6f73] bg-[#0f6f73] text-white shadow-xl hover:shadow-2xl"
                    : "border-[#d7e3e2] bg-white/95 text-[#0e2f31] shadow-md hover:-translate-y-0.5 hover:shadow-lg"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                        link.highlight
                          ? "border-white/30 bg-white/10"
                          : "border-[#e5eeed] bg-[#f4f8f7]"
                      }`}
                    >
                      {IconComponent && (
                        <IconComponent
                          className={`h-5 w-5 ${
                            link.highlight ? "text-white" : "text-[#0f6f73]"
                          }`}
                        />
                      )}
                    </span>
                    <h2 className="text-lg font-semibold tracking-tight">
                      {link.title}
                    </h2>
                  </div>
                  {link.highlight ? (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-[0.2em]">
                      Priority
                    </span>
                  ) : null}
                </div>
                <p
                  className={`text-sm ${
                    link.highlight ? "text-white/80" : "text-[#5b6b69]"
                  }`}
                >
                  {link.description}
                </p>
              </button>
            ) : (
              <ActionLink
                key={link.title}
                href={trackedHref}
                onClick={() => trackLink(link.title, "primary", trackedHref)}
                className={`group flex flex-col gap-2 rounded-2xl border px-5 py-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6f73]/60 ${
                  link.highlight
                    ? "border-[#0f6f73] bg-[#0f6f73] text-white shadow-xl"
                    : "border-[#d7e3e2] bg-white/95 text-[#0e2f31] shadow-md hover:-translate-y-0.5 hover:shadow-lg"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                        link.highlight
                          ? "border-white/30 bg-white/10"
                          : "border-[#e5eeed] bg-[#f4f8f7]"
                      }`}
                    >
                      {IconComponent && (
                        <IconComponent
                          className={`h-5 w-5 ${
                            link.highlight ? "text-white" : "text-[#0f6f73]"
                          }`}
                        />
                      )}
                    </span>
                    <h2 className="text-lg font-semibold tracking-tight">
                      {link.title}
                    </h2>
                  </div>
                  {link.highlight ? (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-[0.2em]">
                      Priority
                    </span>
                  ) : null}
                </div>
                <p
                  className={`text-sm ${
                    link.highlight ? "text-white/80" : "text-[#5b6b69]"
                  }`}
                >
                  {link.description}
                </p>
              </ActionLink>
            );
          })}
        </section>

        <section className="rounded-2xl border border-[#d7e3e2] bg-white/90 p-6 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#0e2f31]">
              Follow + Reviews
            </h3>
            <span className="text-xs uppercase tracking-[0.2em] text-[#5b6b69]">
              Official
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {socialLinks.map((link) => {
              const IconComponent = iconMap[link.iconName] as IconType | undefined;
              const trackedHref = addUtmParams(link.href, campaign);

              return (
                <ActionLink
                  key={link.title}
                  href={trackedHref}
                  onClick={() => trackLink(link.title, "social", trackedHref)}
                  className="flex items-center justify-between rounded-xl border border-[#edf2f1] px-4 py-3 text-sm font-semibold text-[#0e2f31] transition hover:border-[#0f6f73]/40 hover:text-[#0f6f73]"
                >
                  <span className="inline-flex items-center gap-2">
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    {link.title}
                  </span>
                  <span aria-hidden="true">&#8599;</span>
                </ActionLink>
              );
            })}
          </div>
        </section>

        <section className="text-center text-xs uppercase tracking-[0.25em] text-[#8b9493]">
          {footerText}
        </section>
      </div>

      {/* Enquiry Dialogs */}
      <EnquiryDialog
        isOpen={openDialog === "private_chef"}
        onOpenChange={(open) => setOpenDialog(open ? "private_chef" : null)}
        enquiryType="private_chef"
        title="Book Private Chef"
        description="Tell us about your event and dining preferences"
      />

      <EnquiryDialog
        isOpen={openDialog === "cooking_class"}
        onOpenChange={(open) => setOpenDialog(open ? "cooking_class" : null)}
        enquiryType="cooking_class"
        title="Cooking Class Inquiry"
        description="Let us know about your group and preferences"
      />

      <EnquiryDialog
        isOpen={openDialog === "blog"}
        onOpenChange={(open) => setOpenDialog(open ? "blog" : null)}
        enquiryType="blog"
        title="Join Our Blog & Recipe List"
        description="Get exclusive recipes and inspiration from WaistLess Foods"
      />
    </main>
  );
}
