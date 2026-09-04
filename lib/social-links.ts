import { fetchLinksPageFromContentful, type SocialLink } from "./contentful-links";

// Map Contentful icon names to SVG file paths
export function getIconPath(iconName: string): string {
  const iconMap: Record<string, string> = {
    Instagram: "/IG.svg",
    Facebook: "/FB.svg",
    Star: "/STAR.svg",
    Yelp: "/YELP.svg",
    Music: "/TT.svg",
    TikTok: "/TT.svg",
    MapPin: "/globe.svg", // Google Business - using globe icon
  };

  return iconMap[iconName] || "/IG.svg";
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  const linksData = await fetchLinksPageFromContentful();
  return linksData.socialLinks;
}
