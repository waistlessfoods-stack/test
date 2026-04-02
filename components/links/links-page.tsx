import type { LinksPageData, LinksPageLink } from "@/lib/contentful-links";
import { Suspense } from "react";
import LinksPageClient from "@/components/links/links-page-client";

export default function LinksPageComponent({
  linksData,
}: {
  linksData: LinksPageData;
}) {
  const profile = {
    name: linksData.profileName,
    tagline: linksData.profileTagline,
    description: linksData.profileDescription,
    phone: linksData.profilePhone,
    email: linksData.profileEmail,
    image: linksData.profileImageUrl,
  };

  const primaryLinks = linksData.primaryLinks.map((link) => ({
    title: link.title || "",
    description: link.description || "",
    href: link.href || "",
    highlight: (link as LinksPageLink).highlight === true,
    iconName: (link as LinksPageLink).icon || "BookOpen",
    hidden: (link as LinksPageLink).hidden === true,
  }));

  const socialLinks = linksData.socialLinks.map((link) => ({
    title: link.title,
    href: link.href,
    iconName: link.icon,
  }));

  return (
    <Suspense fallback={<div className="h-screen bg-[#f6f4f0]" />}>
      <LinksPageClient 
        profile={profile}
        conferenceHeading={linksData.conferenceHeading}
        conferenceSubheading={linksData.conferenceSubheading}
        primaryLinks={primaryLinks}
        socialLinks={socialLinks}
        footerText={linksData.footerText}
      />
    </Suspense>
  );
}


