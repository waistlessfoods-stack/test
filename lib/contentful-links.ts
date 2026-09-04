import { createClient } from "contentful";
import { unstable_cache } from "next/cache";

// --- Config ---

type ContentfulConfig = {
  accessToken: string;
  spaceId: string;
};

function getContentfulConfig(): ContentfulConfig | null {
  const accessToken =
    process.env.CONTENTFUL_DELIVERY_TOKEN ||
    process.env.NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN;
  const spaceId =
    process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;

  if (!accessToken || !spaceId) {
    return null;
  }

  return { accessToken, spaceId };
}

function getRequiredContentfulConfig(): ContentfulConfig {
  const config = getContentfulConfig();

  if (!config) {
    throw new Error(
      "Missing Contentful delivery credentials. Set CONTENTFUL_DELIVERY_TOKEN and CONTENTFUL_SPACE_ID."
    );
  }

  return config;
}

function createContentfulClient(config: ContentfulConfig) {
  return createClient({ space: config.spaceId, accessToken: config.accessToken });
}

// --- Asset URL helper ---

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function getAssetUrl(asset: unknown): string | null {
  const fields = toRecord(toRecord(asset).fields);
  const file = toRecord(fields.file);
  const url = file.url;
  if (!url || typeof url !== "string") return null;
  return url.startsWith("//") ? `https:${url}` : url;
}

// --- Error handling ---

const contentfulWarningsShown = new Set<string>();

function logContentfulFetchError(context: string, error: unknown): void {
  if (!error || typeof error !== "object") {
    console.error(context, error);
    return;
  }

  const maybeError = error as { message?: unknown; status?: unknown };
  const status = maybeError.status;
  const message = typeof maybeError.message === "string" ? maybeError.message : "";

  if (
    status === 401 ||
    status === 403 ||
    message.includes("AccessTokenInvalid") ||
    message.includes("invalid_token")
  ) {
    const key = "contentful-auth";
    if (!contentfulWarningsShown.has(key)) {
      contentfulWarningsShown.add(key);
      console.warn(
        "Contentful Delivery API token is invalid or missing. " +
          "Set CONTENTFUL_DELIVERY_TOKEN in your .env."
      );
    }
    return;
  }

  console.error(context, error);
}

// ===== TYPES =====

export type LinksPageLink = {
  id: string;
  title: string;
  description: string;
  href: string;
  highlight: boolean;
  icon: string;
  sortOrder: number;
  hidden?: boolean;
};

export type SocialLink = {
  title: string;
  href: string;
  icon: string;
};

export type LinksPageData = {
  profileName: string;
  profileTagline: string;
  profileDescription: string;
  profilePhone: string;
  profileEmail: string;
  profileImageUrl: string | null;
  conferenceHeading: string;
  conferenceSubheading: string;
  primaryLinks: LinksPageLink[];
  socialLinks: SocialLink[];
  footerText: string;
};

// ===== FETCHER =====

async function fetchLinksPageFromContentfulRaw(): Promise<LinksPageData> {
  console.log("[Contentful] fetchLinksPage: start");
  const config = getRequiredContentfulConfig();

  try {
    const client = createContentfulClient(config);
    // include:2 resolves profileImage (asset) and primaryLinksReferences (entries) in one request
    const entries = await client.getEntries({
      content_type: "linksPage",
      include: 2,
      limit: 1,
    } as never);
    const entry = entries.items[0];
    if (!entry) {
      throw new Error("No links page entry found in Contentful.");
    }
    console.log("[Contentful] fetchLinksPage: entry found", entry.sys.id);

    const f = toRecord(entry.fields);

    const primaryLinkReferences = Array.isArray(f.primaryLinksReferences)
      ? f.primaryLinksReferences
      : [];
    const primaryLinks: LinksPageLink[] = primaryLinkReferences
      .map((entryValue) => {
        const linkedEntry = toRecord(entryValue);
        const sys = toRecord(linkedEntry.sys);
        const fields = toRecord(linkedEntry.fields);

        return {
          id: String(sys.id ?? ""),
          title: String(fields.title ?? ""),
          description: String(fields.description ?? ""),
          href: String(fields.href ?? ""),
          highlight: Boolean(fields.highlight ?? false),
          icon: String(fields.icon ?? ""),
          sortOrder: Number(fields.sortOrder ?? 0),
          hidden: Boolean(fields.hidden ?? false),
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const linksResult = {
      profileName: String(f.profileName ?? ""),
      profileTagline: String(f.profileTagline ?? ""),
      profileDescription: String(f.profileDescription ?? ""),
      profilePhone: String(f.profilePhone ?? ""),
      profileEmail: String(f.profileEmail ?? ""),
      profileImageUrl: getAssetUrl(f.profileImage),
      conferenceHeading: String(f.conferenceHeading ?? ""),
      conferenceSubheading: String(f.conferenceSubheading ?? ""),
      primaryLinks,
      socialLinks: Array.isArray(f.socialLinks)
        ? (f.socialLinks as SocialLink[])
        : [],
      footerText: String(f.footerText ?? ""),
    };
    console.log("[Contentful] fetchLinksPage: result", linksResult);
    return linksResult;
  } catch (error) {
    logContentfulFetchError("Error fetching links page from Contentful:", error);
    throw new Error("Unable to fetch links page data from Contentful.");
  }
}

// ===== CACHED EXPORT =====

export const fetchLinksPageFromContentful = unstable_cache(
  fetchLinksPageFromContentfulRaw,
  ["contentful-links-page"],
  { revalidate: 300, tags: ["links-page"] }
);
