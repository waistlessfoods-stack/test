import type { ReactNode } from "react";
import { headers } from "next/headers";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getSocialLinks } from "@/lib/social-links";
import {
  fetchFooterSettingsFromContentful,
  fetchHeaderSettingsFromContentful,
  type FooterSettings,
  type HeaderSettings,
} from "@/lib/contentful-management";
import type { SocialLink } from "@/lib/contentful-links";
import SiteAccessGate from "@/components/layout/site-access-gate";

const FALLBACK_SOCIAL_LINKS: SocialLink[] = [
  {
    title: "Instagram",
    href: "https://www.instagram.com/waistlessfoods",
    icon: "Instagram",
  },
  {
    title: "TikTok",
    href: "https://www.tiktok.com/@waistlessfoods",
    icon: "Music",
  },
];

async function withContentfulFallback<T>(
  label: string,
  loader: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    console.error(`[LayoutShell] Failed to load ${label} from Contentful`, error);
    return fallback;
  }
}

export default async function LayoutShell({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isLinksPage = pathname === "/links" || pathname.startsWith("/links/");

  if (isLinksPage) {
    return <SiteAccessGate>{children}</SiteAccessGate>;
  }

  const [socialLinks, headerSettings, footerSettings] = await Promise.all([
    withContentfulFallback("social links", getSocialLinks, FALLBACK_SOCIAL_LINKS),
    withContentfulFallback<HeaderSettings | null>(
      "header settings",
      fetchHeaderSettingsFromContentful,
      null
    ),
    withContentfulFallback<FooterSettings | null>(
      "footer settings",
      fetchFooterSettingsFromContentful,
      null
    ),
  ]);

  return (
    <SiteAccessGate>
      <Header socialLinks={socialLinks} headerSettings={headerSettings} />
      {children}
      <Footer socialLinks={socialLinks} footerSettings={footerSettings} />
    </SiteAccessGate>
  );
}
