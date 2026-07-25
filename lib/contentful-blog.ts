import "server-only";

import { unstable_cache } from "next/cache";
import { createClient as createDeliveryClient } from "contentful";
import type { Document } from "@contentful/rich-text-types";

type DeliveryConfig = {
  accessToken: string;
  spaceId: string;
  environmentId: string;
};

const APPROVED_BLOG_CATEGORIES = [
  "Chef Inspiration",
  "Culinary Skills & Techniques",
  "Sustainable Cooking & Kitchen Tips",
] as const;

const DEFAULT_BLOG_CATEGORY = APPROVED_BLOG_CATEGORIES[0];
const LEGACY_HERB_SLUG = "5-easy-meal-prep-ideas";
const FINAL_HERB_SLUG = "the-chefs-guide-to-herbs";

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
  triviaQuestion?: Document;
  body?: Document;
  triviaAnswerHeading?: string;
  triviaAnswer?: Document;
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
  const slug = normalizeBlogSlug(f.slug, title);
  const category = normalizeBlogCategory(f.category);
  const readTimeMinutes = Number(f.readTimeMinutes ?? 5);
  const imagePath = getAssetUrl(f.coverImage) || String(f.imagePath ?? "");
  const triviaQuestion = removeLegacyTriviaQuestionChrome(
    getRichTextDocument(f.triviaQuestion)
  );
  const rawTriviaAnswer = getRichTextDocument(f.triviaAnswer);
  const triviaAnswerHeading =
    String(f.triviaAnswerHeading ?? "").trim() ||
    findLegacyTriviaAnswerHeading(rawTriviaAnswer);
  const triviaAnswer = removeLegacyTriviaAnswerChrome(rawTriviaAnswer);

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
    triviaQuestion,
    body: getRichTextDocument(f.body),
    triviaAnswerHeading: triviaAnswerHeading || undefined,
    triviaAnswer,
  };
}

function normalizeBlogCategory(value: unknown): string {
  const category = String(value ?? "").trim();

  if (category === "Chef-Inspiration") {
    return "Chef Inspiration";
  }

  return APPROVED_BLOG_CATEGORIES.includes(
    category as (typeof APPROVED_BLOG_CATEGORIES)[number]
  )
    ? category
    : DEFAULT_BLOG_CATEGORY;
}

function normalizeBlogSlug(value: unknown, title: string): string {
  const slug = String(value ?? slugify(title)).trim();
  return slug === LEGACY_HERB_SLUG ? FINAL_HERB_SLUG : slug;
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

function getRichTextDocument(value: unknown): Document | undefined {
  if (!value || typeof value !== "object") return undefined;

  const document = value as Partial<Document>;
  if (document.nodeType !== "document" || !Array.isArray(document.content)) {
    return undefined;
  }

  return document as Document;
}

function getRichTextNodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";

  const candidate = node as {
    nodeType?: unknown;
    value?: unknown;
    content?: unknown[];
  };

  if (candidate.nodeType === "text") {
    return typeof candidate.value === "string" ? candidate.value : "";
  }

  return Array.isArray(candidate.content)
    ? candidate.content.map(getRichTextNodeText).join("")
    : "";
}

function removeTopLevelRichTextNodes(
  document: Document | undefined,
  shouldRemove: (nodeType: string, text: string) => boolean
): Document | undefined {
  if (!document) return undefined;

  return {
    ...document,
    content: document.content.filter((node) => {
      const nodeType = String(node.nodeType ?? "");
      const text = getRichTextNodeText(node).trim();
      return !shouldRemove(nodeType, text);
    }),
  };
}

function removeLegacyTriviaQuestionChrome(
  document: Document | undefined
): Document | undefined {
  return removeTopLevelRichTextNodes(document, (nodeType, text) => {
    const normalized = text.toLowerCase();
    return (
      (nodeType === "paragraph" && normalized === "before you read on") ||
      (nodeType === "heading-2" &&
        normalized === "something to chew on | trivia") ||
      (nodeType === "paragraph" &&
        normalized.startsWith("scroll to the answer reveal"))
    );
  });
}

function findLegacyTriviaAnswerHeading(
  document: Document | undefined
): string {
  if (!document) return "";

  const heading = document.content.find(
    (node) =>
      node.nodeType === "heading-2" &&
      /^trivia answer:/i.test(getRichTextNodeText(node).trim())
  );

  return heading ? getRichTextNodeText(heading).trim() : "";
}

function removeLegacyTriviaAnswerChrome(
  document: Document | undefined
): Document | undefined {
  return removeTopLevelRichTextNodes(document, (nodeType, text) => {
    const normalized = text.toLowerCase();
    return (
      (nodeType === "paragraph" &&
        (normalized === "answer reveal" || normalized === "")) ||
      (nodeType === "heading-2" && /^trivia answer:/i.test(text))
    );
  });
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

    let entries = await client.getEntries({
      content_type: "blogPost",
      "fields.slug": slug,
      include: 2,
      limit: 1,
    } as Record<string, unknown>);

    if (entries.items.length === 0 && slug === FINAL_HERB_SLUG) {
      entries = await client.getEntries({
        content_type: "blogPost",
        "fields.slug": LEGACY_HERB_SLUG,
        include: 2,
        limit: 1,
      } as Record<string, unknown>);
    }

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

const fetchBlogPostBySlugFromContentfulCached = unstable_cache(
  fetchBlogPostBySlugFromContentfulRaw,
  ["contentful-blog-post-by-slug"],
  { revalidate: 300, tags: ["blog-page"] }
);

export async function fetchBlogPostBySlugFromContentful(
  slug: string
): Promise<BlogPost | null> {
  if (process.env.NODE_ENV !== "production") {
    return fetchBlogPostBySlugFromContentfulRaw(slug);
  }

  return fetchBlogPostBySlugFromContentfulCached(slug);
}
