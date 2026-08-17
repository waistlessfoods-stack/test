export const CONTENTFUL_TAGS = [
  "homepage",
  "about-page",
  "services",
  "recipes-page",
  "shop-page",
  "links-page",
  "blog-page",
  "header-settings",
  "footer-settings",
  "authentication-settings",
] as const;

export type ContentfulTag = (typeof CONTENTFUL_TAGS)[number];

const CONTENT_TYPE_TAGS: Record<string, readonly ContentfulTag[]> = {
  homepage: ["homepage"],
  aboutPage: ["about-page"],
  service: ["services"],
  recipesPage: ["recipes-page"],
  shopPage: ["shop-page"],
  recipe: ["recipes-page", "shop-page"],
  recipeCategory: ["recipes-page", "shop-page"],
  linksPage: ["links-page"],
  primaryLink: ["links-page"],
  headerSettings: ["header-settings"],
  footerSettings: ["footer-settings"],
  authenticationSettings: ["authentication-settings"],
  blogPost: ["blog-page"],
};

export function isContentfulTag(value: string): value is ContentfulTag {
  return CONTENTFUL_TAGS.includes(value as ContentfulTag);
}

export function getTagsForContentType(contentType: string): ContentfulTag[] {
  return [...(CONTENT_TYPE_TAGS[contentType] ?? [])];
}

export function normalizeRequestedTags(values: unknown): ContentfulTag[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter(
    (value): value is ContentfulTag =>
      typeof value === "string" && isContentfulTag(value)
  );
}

export function normalizeRequestedPaths(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter(
    (value): value is string =>
      typeof value === "string" && value.startsWith("/") && value.length > 1
  );
}
