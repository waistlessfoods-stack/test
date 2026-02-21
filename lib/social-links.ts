import { fetchLinksPageFromContentful, type SocialLink } from "./contentful-links";

// Default social links as fallback
const defaultSocialLinks: SocialLink[] = [
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
    title: "Yelp",
    href: "https://www.yelp.com/biz/waistless-foods-houston-2",
    icon: "Star",
  },
];

// Map Contentful icon names to SVG file paths
export function getIconPath(iconName: string): string {
  const iconMap: Record<string, string> = {
    Instagram: "/IG.svg",
    Facebook: "/FB.svg",
    Star: "/STAR.svg",
    Yelp: "/STAR.svg",
    Music: "/IG.svg", // TikTok - using IG as placeholder until tiktok.svg is added
    MapPin: "/globe.svg", // Google Business - using globe icon
  };

  return iconMap[iconName] || "/IG.svg";
}

// Fetch social links with caching
let cachedSocialLinks: SocialLink[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getSocialLinks(): Promise<SocialLink[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedSocialLinks && now - lastFetchTime < CACHE_DURATION) {
    return cachedSocialLinks;
  }

  try {
    const linksData = await fetchLinksPageFromContentful();
    const socialLinks = linksData?.socialLinks || defaultSocialLinks;

    // Update cache
    cachedSocialLinks = socialLinks;
    lastFetchTime = now;

    return socialLinks;
  } catch (error) {
    console.error("Error fetching social links:", error);
    return defaultSocialLinks;
  }
}
