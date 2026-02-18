import type { LinksPageData, LinksPageLink } from "@/lib/contentful-links";
import { Suspense } from "react";
import LinksPageClient from "@/components/links/links-page-client";

const defaultProfile = {
  name: "WaistLess Foods",
  tagline: "Luxury In-Home Dining & Private Events",
  description:
    "Intimate In-Home Dining & Boutique Events",
  phone: "281-436-9245",
  email: "info@waistlessfoods.com",
  image: "/logo.png",
};

const defaultPrimaryLinks: Array<{
  title: string;
  description: string;
  href: string;
  highlight?: boolean;
  icon: string;
  hidden?: boolean;
}> = [
  {
    title: "Book Private Chef",
    description: "In-home dining experiences tailored to your event.",
    href: "mailto:info@waistlessfoods.com?subject=Private%20Chef%20Inquiry",
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
    href: "mailto:info@waistlessfoods.com?subject=Cooking%20Class%20Inquiry",
    icon: "Users",
  },
  {
    title: "Membership / VIP List",
    description: "Priority access to menus, events, and private drops.",
    href: "mailto:info@waistlessfoods.com?subject=VIP%20List",
    icon: "Crown",
    hidden: true,
  },
  {
    title: "Recipes & Blog",
    description: "Explore seasonal recipes and kitchen tips.",
    href: "/recipes",
    icon: "BookOpen",
    hidden: true,
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
        image: linksData.profileImageUrl,
      }
    : defaultProfile;

  const conferenceHeading = linksData?.conferenceHeading || "Visiting from Feed The Soul Culinary Conference?";
  const conferenceSubheading = linksData?.conferenceSubheading || "Join the list for exclusive recipes and inspiration from the WaistLess Foods Blog.";

  const primaryLinks = (linksData?.primaryLinks || defaultPrimaryLinks).map((link) => {
    // Check if the link has a hidden field from Contentful, otherwise fall back to default
    const defaultLink = defaultPrimaryLinks.find(dl => dl.title === link.title);
    const isHidden = linksData?.primaryLinks 
      ? (link as LinksPageLink).hidden === true  // Use Contentful data if available
      : defaultLink?.hidden === true;             // Otherwise use default
    
    return {
      title: link.title || "",
      description: link.description || "",
      href: link.href || "",
      highlight: (link as LinksPageLink).highlight === true,
      iconName: (link as LinksPageLink).icon || "BookOpen",
      hidden: isHidden,
    };
  });

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


