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

export type ServiceEntry = {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  imagePath: string;
  sortOrder: number;
};

export async function fetchServicesFromContentful(): Promise<ServiceEntry[] | null> {
  const config = getContentfulConfig();
  if (!config) {
    return null;
  }

  const client = createClient({ accessToken: config.accessToken });
  const space = await client.getSpace(config.spaceId);
  const environment = await space.getEnvironment(config.environmentId);

  const entries = await environment.getEntries({
    content_type: "service",
    order: "fields.sortOrder",
  });

  const items = entries.items
    .map((entry) => {
      const fields = entry.fields as Record<string, Record<string, unknown>>;

      return {
        id: entry.sys.id,
        title: String(fields.title?.[DEFAULT_LOCALE] ?? ""),
        description: String(fields.description?.[DEFAULT_LOCALE] ?? ""),
        benefits: (fields.benefits?.[DEFAULT_LOCALE] as string[]) || [],
        imagePath: String(fields.imagePath?.[DEFAULT_LOCALE] ?? ""),
        sortOrder: Number(fields.sortOrder?.[DEFAULT_LOCALE] ?? 0),
      };
    })
    .filter((item) => item.title && item.description && item.imagePath);

  console.log("Contentful services", items);

  return items;
}
