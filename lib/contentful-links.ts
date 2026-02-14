import { createClient } from "contentful-management";

const DEFAULT_LOCALE = "en-US";

function getContentfulConfig() {
  const accessToken = process.env.CMA_CONTENTFUL;
  const spaceId =
    process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
  const environmentId =
    process.env.Contentful_environment ||
    process.env.CONTENTFUL_ENVIRONMENT ||
    "master";

  if (!accessToken || !spaceId) {
    return null;
  }

  return { accessToken, spaceId, environmentId };
}

export type LinksPageLink = {
  id: string;
  title: string;
  description: string;
  href: string;
  highlight: boolean;
  icon: string;
  sortOrder: number;
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
  profileImagePath: string;
  conferenceHeading: string;
  conferenceSubheading: string;
  primaryLinks: LinksPageLink[];
  socialLinks: SocialLink[];
  footerText: string;
};

const mapLinksPageData = (entry: {
  sys: { id: string };
  fields: Record<string, Record<string, unknown>>;
}): LinksPageData => {
  const fields = entry.fields;
  const primaryLinksReferences = fields.primaryLinksReferences?.[
    DEFAULT_LOCALE
  ] as Array<{ sys?: { id: string } }> | undefined;

  return {
    profileName: String(fields.profileName?.[DEFAULT_LOCALE] ?? ""),
    profileTagline: String(fields.profileTagline?.[DEFAULT_LOCALE] ?? ""),
    profileDescription: String(
      fields.profileDescription?.[DEFAULT_LOCALE] ?? ""
    ),
    profilePhone: String(fields.profilePhone?.[DEFAULT_LOCALE] ?? ""),
    profileEmail: String(fields.profileEmail?.[DEFAULT_LOCALE] ?? ""),
    profileImagePath: String(fields.profileImagePath?.[DEFAULT_LOCALE] ?? ""),
    conferenceHeading: String(fields.conferenceHeading?.[DEFAULT_LOCALE] ?? ""),
    conferenceSubheading: String(
      fields.conferenceSubheading?.[DEFAULT_LOCALE] ?? ""
    ),
    primaryLinks:
      primaryLinksReferences?.map((link) => ({
        id: link.sys?.id ?? "",
        title: "",
        description: "",
        href: "",
        highlight: false,
        icon: "",
        sortOrder: 0,
      })) || [],
    socialLinks: (fields.socialLinks?.[DEFAULT_LOCALE] as SocialLink[]) || [],
    footerText: String(fields.footerText?.[DEFAULT_LOCALE] ?? ""),
  };
};

export async function fetchLinksPageFromContentful(): Promise<LinksPageData | null> {
  const config = getContentfulConfig();
  if (!config) {
    return null;
  }

  try {
    const client = createClient({ accessToken: config.accessToken });
    const space = await client.getSpace(config.spaceId);
    const environment = await space.getEnvironment(config.environmentId);

    // Fetch the links page entry
    const entries = await environment.getEntries({
      content_type: "linksPage",
      limit: 1,
    });

    const linksPageEntry = entries.items[0];
    if (!linksPageEntry) {
      return null;
    }

    const linksPageData = mapLinksPageData(
      linksPageEntry as {
        sys: { id: string };
        fields: Record<string, Record<string, unknown>>;
      }
    );

    // Fetch referenced link entries
    const primaryLinksReferences = (
      linksPageEntry.fields.primaryLinksReferences?.[DEFAULT_LOCALE] || []
    ) as Array<{ sys?: { id: string } }>;

    const primaryLinksIds = primaryLinksReferences
      .map((ref) => ref.sys?.id)
      .filter((id) => id !== undefined);

    if (primaryLinksIds.length > 0) {
      const linksEntries = await environment.getEntries({
        content_type: "linksPageLink",
        "sys.id[in]": primaryLinksIds.join(","),
      });

      // Map the entries and sort them
      const primaryLinksMap = new Map<string, LinksPageLink>();
      linksEntries.items.forEach((linkEntry) => {
        const fields = linkEntry.fields;
        const link: LinksPageLink = {
          id: linkEntry.sys.id,
          title: String(fields.title?.[DEFAULT_LOCALE] ?? ""),
          description: String(fields.description?.[DEFAULT_LOCALE] ?? ""),
          href: String(fields.href?.[DEFAULT_LOCALE] ?? ""),
          highlight: Boolean(fields.highlight?.[DEFAULT_LOCALE] ?? false),
          icon: String(fields.icon?.[DEFAULT_LOCALE] ?? ""),
          sortOrder: Number(fields.sortOrder?.[DEFAULT_LOCALE] ?? 0),
        };
        primaryLinksMap.set(linkEntry.sys.id, link);
      });

      // Rebuild array in reference order, sorted by sortOrder
      linksPageData.primaryLinks = primaryLinksIds
        .map((id) => primaryLinksMap.get(id))
        .filter((link) => link !== undefined)
        .sort(
          (a, b) =>
            (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0)
        ) as LinksPageLink[];
    }

    return linksPageData;
  } catch (error) {
    console.error("Error fetching links page from Contentful:", error);
    return null;
  }
}
