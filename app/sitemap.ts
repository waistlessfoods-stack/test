import type { MetadataRoute } from "next";
import {
  fetchRecipesPageFromContentful,
  fetchServicesFromContentful,
} from "@/lib/contentful-management";
import { fetchBlogPageFromContentful } from "@/lib/contentful-blog";

export const revalidate = 300;

function getBaseUrl(): string {
  return "https://www.waistlessfoods.com";
}

function toAbsoluteUrl(baseUrl: string, pathname: string): string {
  return `${baseUrl}${pathname === "/" ? "" : pathname}`;
}

function isFreeRecipe(price: string): boolean {
  const normalized = price.trim().toLowerCase();

  if (!normalized || normalized === "free") {
    return true;
  }

  const numericPrice = parseFloat(normalized.replace(/[^0-9.-]+/g, ""));
  return !Number.isNaN(numericPrice) && numericPrice <= 0;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: toAbsoluteUrl(baseUrl, "/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: toAbsoluteUrl(baseUrl, "/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl(baseUrl, "/services"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl(baseUrl, "/shop"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl(baseUrl, "/recipes"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl(baseUrl, "/blog"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl(baseUrl, "/links"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  try {
    const services = await fetchServicesFromContentful();
    entries.push(
      ...services
        .filter((service) => service.slug)
        .map((service) => ({
          url: toAbsoluteUrl(baseUrl, `/services/${service.slug}`),
          lastModified: now,
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }))
    );
  } catch (error) {
    console.error("[sitemap] Failed to load service URLs", error);
  }

  try {
    const recipesPage = await fetchRecipesPageFromContentful();
    entries.push(
      ...recipesPage.recipes
        .filter((recipe) => recipe.slug)
        .map((recipe) => ({
          url: toAbsoluteUrl(
            baseUrl,
            isFreeRecipe(recipe.price)
              ? `/recipes/detail/${recipe.slug}/full`
              : `/recipes/detail/${recipe.slug}`
          ),
          lastModified: now,
          changeFrequency: "monthly" as const,
          priority: isFreeRecipe(recipe.price) ? 0.75 : 0.7,
        }))
    );
  } catch (error) {
    console.error("[sitemap] Failed to load recipe URLs", error);
  }

  try {
    const blogPage = await fetchBlogPageFromContentful();
    entries.push(
      ...blogPage.posts
        .filter((post) => post.slug)
        .map((post) => ({
          url: toAbsoluteUrl(baseUrl, `/blog/${post.slug}`),
          lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }))
    );
  } catch (error) {
    console.error("[sitemap] Failed to load blog URLs", error);
  }

  return entries;
}
