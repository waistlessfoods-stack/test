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
  slug: string;
  title: string;
  description: string;
  benefits: string[];
  imagePath: string;
  sortOrder: number;
};

export type ServiceReviewItem = {
  name: string;
  rating: number;
  date: string;
  comment: string;
};

export type ServiceReviews = {
  averageRating: number;
  totalReviews: number;
  items: ServiceReviewItem[];
};

export type ServiceDetailEntry = ServiceEntry & {
  breadcrumbLabel: string;
  priceText: string;
  includes: string[];
  howToBook: string[];
  mainImagePath: string;
  galleryImagePaths: string[];
  reviews: ServiceReviews | null;
};

const mapServiceFields = (entry: {
  sys: { id: string };
  fields: Record<string, Record<string, unknown>>;
}) => {
  const fields = entry.fields;
  const reviews = fields.reviews?.[DEFAULT_LOCALE] as
    | ServiceReviews
    | undefined;

  return {
    id: entry.sys.id,
    slug: String(fields.slug?.[DEFAULT_LOCALE] ?? ""),
    title: String(fields.title?.[DEFAULT_LOCALE] ?? ""),
    description: String(fields.description?.[DEFAULT_LOCALE] ?? ""),
    benefits: (fields.benefits?.[DEFAULT_LOCALE] as string[]) || [],
    imagePath: String(fields.imagePath?.[DEFAULT_LOCALE] ?? ""),
    sortOrder: Number(fields.sortOrder?.[DEFAULT_LOCALE] ?? 0),
    breadcrumbLabel: String(fields.breadcrumbLabel?.[DEFAULT_LOCALE] ?? ""),
    priceText: String(fields.priceText?.[DEFAULT_LOCALE] ?? ""),
    includes: (fields.includes?.[DEFAULT_LOCALE] as string[]) || [],
    howToBook: (fields.howToBook?.[DEFAULT_LOCALE] as string[]) || [],
    mainImagePath: String(fields.mainImagePath?.[DEFAULT_LOCALE] ?? ""),
    galleryImagePaths:
      (fields.galleryImagePaths?.[DEFAULT_LOCALE] as string[]) || [],
    reviews: reviews ?? null,
  };
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
    .map((entry) =>
      mapServiceFields(
        entry as {
          sys: { id: string };
          fields: Record<string, Record<string, unknown>>;
        }
      )
    )
    .filter((item) => item.title && item.description && item.imagePath);

  console.log("Contentful services", items);

  return items;
}

export async function fetchServiceDetailFromContentful(
  slug: string
): Promise<ServiceDetailEntry | null> {
  const config = getContentfulConfig();
  if (!config) {
    return null;
  }

  const client = createClient({ accessToken: config.accessToken });
  const space = await client.getSpace(config.spaceId);
  const environment = await space.getEnvironment(config.environmentId);

  const entries = await environment.getEntries({
    content_type: "service",
    "fields.slug": slug,
    limit: 1,
  });

  const entry = entries.items[0];
  if (!entry) {
    return null;
  }

  return mapServiceFields(
    entry as {
      sys: { id: string };
      fields: Record<string, Record<string, unknown>>;
    }
  );
}
