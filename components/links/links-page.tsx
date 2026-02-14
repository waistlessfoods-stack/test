import type { LinksPageData, LinksPageLink } from "@/lib/contentful-links";
import { Suspense } from "react";
import LinksPageClient from "@/components/links/links-page-client";

const defaultProfile = {
  name: "WaistLess Foods",
  tagline: "Luxury In-Home Dining & Private Events",
  description:
    "WaistLess Foods delivers the ultimate private chef and catering service, transforming every ingredient into intentional, indulgent cuisine. Experience a menu curated to your needs, bringing captivating flavors and artful presentation to your next special occasion.",
  phone: "281-436-9245",
  email: "info@waistlessfoods.com",
  image: "/amber.jpg",
};

const defaultPrimaryLinks: Array<{
  title: string;
  description: string;
  href: string;
  highlight?: boolean;
  icon: string;
}> = [
  {
    title: "Book Private Chef",
    description: "In-home dining experiences tailored to your event.",
    href: "/services/private",
    highlight: true,
    icon: "ChefHat",
  },
  {
    title: "Catering Inquiry",
    description: "Menus for corporate, weddings, and special occasions.",
    href: "mailto:info@waistlessfoods.com?subject=Catering%20Inquiry",
    icon: "Utensils",
  },
  {
    title: "Cooking Classes",
    description: "Interactive classes for teams, groups, and celebrations.",
    href: "/services/cooking-class",
    icon: "Users",
  },
  {
    title: "Membership / VIP List",
    description: "Priority access to menus, events, and private drops.",
    href: "mailto:info@waistlessfoods.com?subject=VIP%20List",
    icon: "Crown",
  },
  {
    title: "Recipes & Blog",
    description: "Explore seasonal recipes and kitchen tips.",
    href: "/recipes",
    icon: "BookOpen",
  },
];

const defaultSocialLinks: Array<{ title: string; href: string; icon: string }> = [
  {
    title: "Instagram",
    href: "https://www.instagram.com/waistlessfoods/?hl=en",
    icon: "Instagram",
  },
  {
    title: "Facebook",
    href: "https://www.facebook.com/WaistLessFoods/",
    icon: "Facebook",
  },
  {
    title: "TikTok",
    href: "https://www.tiktok.com/@waistlessfoods",
    icon: "Music",
  },
  {
    title: "Google Business",
    href: "https://share.google/ALuik169vluev16od",
    icon: "MapPin",
  },
  {
    title: "Yelp",
    href: "https://www.yelp.com/biz/waistless-foods-houston-2",
    icon: "Star",
  },
];

export default function LinksPageComponent({ linksData }: { linksData: LinksPageData | null }) {
  // Use Contentful data if available, otherwise fall back to defaults
  const profile = linksData
    ? {
        name: linksData.profileName,
        tagline: linksData.profileTagline,
        description: linksData.profileDescription,
        phone: linksData.profilePhone,
        email: linksData.profileEmail,
        image: linksData.profileImagePath,
      }
    : defaultProfile;

  const conferenceHeading = linksData?.conferenceHeading || "Visiting from Culinary Conference?";
  const conferenceSubheading = linksData?.conferenceSubheading || "Join the VIP list for exclusive menus and private event booking priority.";

  const primaryLinks = (linksData?.primaryLinks || defaultPrimaryLinks).map((link) => ({
    title: link.title || "",
    description: link.description || "",
    href: link.href || "",
    highlight: (link as LinksPageLink).highlight === true,
    iconName: (link as LinksPageLink).icon || "BookOpen",
  }));

  const socialLinks = (linksData?.socialLinks || defaultSocialLinks).map((link) => ({
    title: link.title,
    href: link.href,
    iconName: link.icon,
  }));

  const footerText = linksData?.footerText || "waistlessfoods.com/links";

  return (
    <Suspense fallback={<div className="h-screen bg-[#f6f4f0]" />}>
      <LinksPageClient 
        profile={profile}
        conferenceHeading={conferenceHeading}
        conferenceSubheading={conferenceSubheading}
        primaryLinks={primaryLinks}
        socialLinks={socialLinks}
        footerText={footerText}
      />
    </Suspense>
  );
}


