import { fetchLinksPageFromContentful, type SocialLink } from "./contentful-links";

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
    const socialLinks = linksData.socialLinks;

    // Update cache
    cachedSocialLinks = socialLinks;
    lastFetchTime = now;

    return socialLinks;
  } catch (error) {
    console.error("Error fetching social links:", error);
    throw new Error("Unable to fetch social links from Contentful.");
  }
}
