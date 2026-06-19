import "server-only";

import { unstable_cache } from "next/cache";
import { createClient as createDeliveryClient } from "contentful";

type DeliveryConfig = {
  accessToken: string;
  spaceId: string;
  environmentId: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  readTimeMinutes: number;
  imagePath: string;
  sortOrder: number;
  publishedAt?: string;
};

export type BlogPageData = {
  heading: string;
  searchPlaceholder: string;
  categoryFilterLabel: string;
  readTimeFilterLabel: string;
  posts: BlogPost[];
  categories: string[];
  readTimeOptions: number[];
};

function mapEntryToBlogPost(
  entry: {
    sys: { id: string };
    fields?: Record<string, unknown>;
  },
  index: number
): BlogPost {
  const f = entry.fields ?? {};
  const title = String(f.title ?? "").trim();
  const excerpt = String(f.excerpt ?? "").trim();
  const slug = String(f.slug ?? slugify(title)).trim();
  const category = String(f.category ?? "Healthy Living").trim();
  const readTimeMinutes = Number(f.readTimeMinutes ?? 5);
  const imagePath = getAssetUrl(f.coverImage) || String(f.imagePath ?? "");

  return {
    id: entry.sys.id,
    title,
    slug,
    excerpt,
    category,
    readTimeMinutes: Number.isFinite(readTimeMinutes) ? readTimeMinutes : 5,
    imagePath,
    sortOrder: Number(f.sortOrder ?? index + 1),
    publishedAt: f.publishedAt ? String(f.publishedAt) : undefined,
  };
}

const warnings = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (warnings.has(key)) return;
  warnings.add(key);
  console.warn(message);
}

function getDeliveryConfig(): DeliveryConfig | null {
  const spaceId = process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID;
  const accessToken =
    process.env.CONTENTFUL_DELIVERY_TOKEN ||
    process.env.NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN;
  const environmentId =
    process.env.Contentful_environment || process.env.CONTENTFUL_ENVIRONMENT || "master";

  if (!accessToken || !spaceId) {
    return null;
  }

  return {
    accessToken,
    spaceId,
    environmentId,
  };
}

function getRequiredDeliveryConfig(): DeliveryConfig {
  const config = getDeliveryConfig();

  if (!config) {
    throw new Error(
      "Missing Contentful delivery credentials. Set CONTENTFUL_DELIVERY_TOKEN and CONTENTFUL_SPACE_ID."
    );
  }

  return config;
}
function getAssetUrl(asset: unknown): string | null {
  const maybeAsset = asset as
    | { fields?: { file?: { url?: unknown } } }
    | undefined;
  const url = maybeAsset?.fields?.file?.url;
  if (!url || typeof url !== "string") return null;
  return url.startsWith("//") ? `https:${url}` : url;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toPageData(posts: BlogPost[]): BlogPageData {
  const sortedPosts = [...posts].sort((a, b) => a.sortOrder - b.sortOrder);
  const categories = Array.from(new Set(sortedPosts.map((post) => post.category)));
  const readTimeOptions = Array.from(
    new Set(sortedPosts.map((post) => post.readTimeMinutes))
  ).sort((a, b) => a - b);

  return {
    heading: "Blogs / News",
    searchPlaceholder: "Search an article or food",
    categoryFilterLabel: "Filter by Category",
    readTimeFilterLabel: "Filter by Read Time",
    posts: sortedPosts,
    categories,
    readTimeOptions,
  };
}

async function fetchBlogPageFromContentfulRaw(): Promise<BlogPageData> {
  const config = getRequiredDeliveryConfig();

  try {
    const client = createDeliveryClient({
      space: config.spaceId,
      accessToken: config.accessToken,
      environment: config.environmentId,
    });

    const entries = await client.getEntries({
      content_type: "blogPost",
      include: 2,
      order: ["fields.sortOrder", "-fields.publishedAt"],
      limit: 100,
    } as Record<string, unknown>);

    const posts: BlogPost[] = entries.items
      .map((entry, index) => mapEntryToBlogPost(entry, index))
      .filter((post) => post.title && post.excerpt && post.imagePath);

    if (posts.length === 0) {
      throw new Error("No blog posts found in Contentful.");
    }

    return toPageData(posts);
  } catch (error) {
    console.error("[Contentful Blog Fetch] Error details:", error);
    warnOnce(
      "contentful-blog-fetch-failed",
      `[Contentful] Failed to fetch blog posts: ${error}`
    );
    throw new Error(
      `Unable to fetch blog data from Contentful: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function fetchBlogPostBySlugFromContentfulRaw(
  slug: string
): Promise<BlogPost | null> {
  const config = getRequiredDeliveryConfig();

  try {
    const client = createDeliveryClient({
      space: config.spaceId,
      accessToken: config.accessToken,
      environment: config.environmentId,
    });

    const entries = await client.getEntries({
      content_type: "blogPost",
      "fields.slug": slug,
      include: 2,
      limit: 1,
    } as Record<string, unknown>);

    const entry = entries.items[0];
    if (!entry) {
      return null;
    }

    const post = mapEntryToBlogPost(entry, 0);
    return post.title && post.excerpt && post.imagePath ? post : null;
  } catch (error) {
    console.error("[Contentful Blog Fetch By Slug] Error details:", error);
    warnOnce(
      "contentful-blog-slug-fetch-failed",
      `[Contentful] Failed to fetch blog post by slug: ${error}`
    );
    throw new Error(
      `Unable to fetch blog post from Contentful: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

const fetchBlogPageFromContentfulCached = unstable_cache(
  fetchBlogPageFromContentfulRaw,
  ["contentful-blog-page"],
  { revalidate: 300, tags: ["blog-page"] }
);

export async function fetchBlogPageFromContentful(): Promise<BlogPageData> {
  if (process.env.NODE_ENV !== "production") {
    return fetchBlogPageFromContentfulRaw();
  }

  return fetchBlogPageFromContentfulCached();
}

export const fetchBlogPostBySlugFromContentful = unstable_cache(
  fetchBlogPostBySlugFromContentfulRaw,
  ["contentful-blog-post-by-slug"],
  { revalidate: 300, tags: ["blog-page"] }
);
