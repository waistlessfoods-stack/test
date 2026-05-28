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

function getAssetUrl(asset: any): string | null {
  const url = asset?.fields?.file?.url;
  if (!url || typeof url !== "string") return null;
  return url.startsWith("//") ? `https:${url}` : url;
}

function getAssetUrls(assets: unknown): string[] {
  if (!Array.isArray(assets)) {
    return [];
  }

  return assets
    .map((asset) => getAssetUrl(asset))
    .filter((url): url is string => typeof url === "string" && url.length > 0);
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

export type ServiceEntry = {
  id: string;
  slug: string;
  title: string;
  description: string;
  benefits: string[];
  imagePath: string | null;
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
  mainImagePath: string | null;
  galleryImagePaths: string[];
  reviews: ServiceReviews | null;
};

export type FeatureItem = {
  id: string;
  title: string;
  description: string;
  imagePath: string | null;
  buttonLabel?: string;
  buttonHref?: string;
  sortOrder: number;
};

export type FeaturedRecipe = {
  id: string;
  title: string;
  slug: string;
  description: string;
  imagePath: string | null;
  sortOrder: number;
};

export type Testimonial = {
  id: string;
  title: string;
  text: string;
  author: string;
  sortOrder: number;
};

export type HomepageData = {
  heroTitle: string;
  heroSubtitle: string;
  heroImagePaths: string[];
  heroImagePath: string | null;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaHref: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaHref: string;
  featuresHeading: string;
  featuresIntro: string;
  features: FeatureItem[];
  aboutHeading: string;
  aboutBodyPrimary: string;
  aboutBodySecondary: string;
  aboutBodyTertiary: string;
  aboutBullets: string[];
  aboutButtonLabel: string;
  aboutButtonHref?: string;
  aboutImagePath: string | null;
  featuredHeading: string;
  featuredDescription?: string;
  featuredRecipes: FeaturedRecipe[];
  testimonialBackgroundPath: string | null;
  testimonials: Testimonial[];
};

export type HeaderSettings = {
  promotionBannerEnabled: boolean;
  promotionBannerText: string;
  promotionBannerBackgroundColor: string;
  promotionBannerTextColor: string;
  promotionBannerLink: string;
};

export type FooterSettings = {
  brandDescription: string;
  newsletterDescription: string;
  quickMenuDescription: string;
  followUsDescription: string;
};

export type AboutPageData = {
  heroTitle: string;
  heroBackgroundImagePath: string | null;
  heroParagraph1: string;
  heroParagraph2: string;
  contentImagePath: string | null;
  logoImagePath: string | null;
  contentHeading: string;
  contentParagraph1: string;
  contentParagraph2: string;
  contentParagraph3: string;
};

export type RecipeCategory = {
  id: string;
  name: string;
  imagePath: string | null;
  sortOrder: number;
};

export type Recipe = {
  id: string;
  slug: string;
  title: string;
  price: string;
  description: string;
  imagePath: string | null;
  sortOrder: number;
  categoryIds?: string[];
  categoryId?: string;
  featured?: boolean;
  detailDescription?: string;
  ingredients?: string[];
  tools?: string[];
  heroImagePath?: string | null;
  ingredientsImagePath?: string | null;
  toolsImagePath?: string | null;
  instructionSteps?: {
    title: string;
    description: string;
    imagePath?: string | null;
  }[];
  cookTime?: string;
  servingSize?: string;
  // Rich Text fields (new, editor-friendly)
  ingredientsRichText?: any;
  toolsRichText?: any;
  instructionsRichText?: any;
};

export type RecipesPageData = {
  bannerImagePath: string | null;
  bannerTitle: string;
  bannerDescription: string;
  bannerFeaturedImage1Path: string | null;
  bannerFeaturedImage2Path: string | null;
  categories: RecipeCategory[];
  recipes: Recipe[];
};

export type ShopPageData = RecipesPageData;

// ===== HELPERS =====

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseInstructionSteps(
  value: unknown
): {
  title: string;
  description: string;
  imagePath?: string;
}[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<
    {
      title: string;
      description: string;
      imagePath?: string;
    }[]
  >((acc, item) => {
      if (!item || typeof item !== "object") {
        return acc;
      }

      const raw = item as Record<string, unknown>;
      const title =
        typeof raw.title === "string"
          ? raw.title
          : typeof raw.stepTitle === "string"
            ? raw.stepTitle
            : "";
      const description =
        typeof raw.description === "string"
          ? raw.description
          : typeof raw.body === "string"
            ? raw.body
            : "";
      const imagePath =
        typeof raw.imagePath === "string"
          ? raw.imagePath
          : getAssetUrl(raw.image as any);

      if (!title && !description) {
        return acc;
      }

      acc.push({
        title: title.trim(),
        description: description.trim(),
        imagePath: imagePath || undefined,
      });

      return acc;
    }, []);
}

function mapServiceFields(entry: any) {
  const f = entry.fields;
  return {
    id: entry.sys.id,
    slug: String(f.slug ?? ""),
    title: String(f.title ?? ""),
    description: String(f.description ?? ""),
    benefits: (f.benefits as string[]) || [],
    imagePath: String(f.imagePath ?? ""),
    sortOrder: Number(f.sortOrder ?? 0),
    breadcrumbLabel: String(f.breadcrumbLabel ?? ""),
    priceText: String(f.priceText ?? ""),
    includes: (f.includes as string[]) || [],
    howToBook: (f.howToBook as string[]) || [],
    mainImagePath: String(f.mainImagePath ?? ""),
    galleryImagePaths: (f.galleryImagePaths as string[]) || [],
    reviews: (f.reviews as ServiceReviews) ?? null,
  };
}

function mapRecipesOrShopPage(entry: any): RecipesPageData {
  const f = entry.fields as any;

  const categories: RecipeCategory[] = ((f.categories as any[]) || [])
    .map((e: any) => ({
      id: e.sys.id,
      name: String(e.fields?.name ?? ""),
      imagePath: getAssetUrl(e.fields?.image),
      sortOrder: Number(e.fields?.sortOrder ?? 0),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const recipes: Recipe[] = ((f.recipes as any[]) || [])
    .map((e: any) => {
      const title = String(e.fields?.title ?? "");
      const imagePath = getAssetUrl(e.fields?.image);
      const multiCategoryIds = Array.isArray(e.fields?.categories)
        ? (e.fields.categories as any[])
            .map((categoryRef: any) => categoryRef?.sys?.id)
            .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
        : [];
      const singleCategoryId = (e.fields?.category as any)?.sys?.id;
      const categoryIds =
        multiCategoryIds.length > 0
          ? multiCategoryIds
          : typeof singleCategoryId === "string" && singleCategoryId.length > 0
            ? [singleCategoryId]
            : [];

      return {
        id: e.sys.id,
        slug: generateSlug(title),
        title,
        price: String(e.fields?.price ?? ""),
        description: String(e.fields?.description ?? ""),
        imagePath,
        sortOrder: Number(e.fields?.sortOrder ?? 0),
        categoryIds,
        categoryId: categoryIds[0],
        featured: Boolean(e.fields?.featured ?? false),
        detailDescription: String(
          e.fields?.detailDescription ?? e.fields?.description ?? ""
        ),
        ingredients: toStringArray(e.fields?.ingredients),
        tools: toStringArray(e.fields?.tools),
        heroImagePath: getAssetUrl(e.fields?.heroImage) || imagePath,
        ingredientsImagePath:
          getAssetUrl(e.fields?.ingredientsImage) || imagePath,
        toolsImagePath: getAssetUrl(e.fields?.toolsImage) || imagePath,
        instructionSteps: parseInstructionSteps(
          e.fields?.instructionSteps ?? e.fields?.instructions
        ),
        cookTime: e.fields?.cookTime ? String(e.fields.cookTime) : undefined,
        servingSize: e.fields?.servingSize ? String(e.fields.servingSize) : undefined,
        ingredientsRichText: e.fields?.ingredientsRichText ?? null,
        toolsRichText: e.fields?.toolsRichText ?? null,
        instructionsRichText: e.fields?.instructionsRichText ?? null,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    bannerImagePath: getAssetUrl(f.bannerImage),
    bannerTitle: String(f.bannerTitle ?? ""),
    bannerDescription: String(f.bannerDescription ?? ""),
    bannerFeaturedImage1Path: getAssetUrl(f.bannerFeaturedImage1),
    bannerFeaturedImage2Path: getAssetUrl(f.bannerFeaturedImage2),
    categories,
    recipes,
  };
}

// ===== FETCHERS =====

async function fetchServicesFromContentfulRaw(): Promise<ServiceEntry[]> {
  console.log("[Contentful] fetchServices: start");
  const config = getRequiredContentfulConfig();

  try {
    const client = createContentfulClient(config);
    const entries = await client.getEntries({
      content_type: "service",
      order: ["fields.sortOrder"],
    } as any);
    console.log(`[Contentful] fetchServices: got ${entries.items.length} entries`);
    const result = entries.items
      .map((e) => mapServiceFields(e))
      .filter((item) => item.title && item.description && item.imagePath);

    if (!result.length) {
      throw new Error("No services found in Contentful.");
    }

    console.log("[Contentful] fetchServices: result", result);
    return result;
  } catch (error) {
    logContentfulFetchError("Error fetching services from Contentful:", error);
    throw new Error("Unable to fetch services from Contentful.");
  }
}

async function fetchServiceDetailFromContentfulRaw(
  slug: string
): Promise<ServiceDetailEntry | null> {
  console.log(`[Contentful] fetchServiceDetail: start, slug=${slug}`);
  const config = getRequiredContentfulConfig();

  try {
    const client = createContentfulClient(config);
    const entries = await client.getEntries({
      content_type: "service",
      "fields.slug": slug,
      limit: 1,
    } as any);
    const entry = entries.items[0];
    if (!entry) {
      console.log(`[Contentful] fetchServiceDetail: no entry found for slug=${slug}`);
      return null;
    }
    const result = mapServiceFields(entry);
    console.log("[Contentful] fetchServiceDetail: result", result);
    return result;
  } catch (error) {
    logContentfulFetchError("Error fetching service detail from Contentful:", error);
    throw new Error("Unable to fetch service detail from Contentful.");
  }
}

async function fetchHomepageFromContentfulRaw(): Promise<HomepageData> {
  console.log("[Contentful] fetchHomepage: start");
  const config = getRequiredContentfulConfig();

  try {
    const client = createContentfulClient(config);
    // include:2 resolves: homepage -> linked entries -> their assets in one request
    const entries = await client.getEntries({
      content_type: "homepage",
      include: 2,
      limit: 1,
    } as any);
    const entry = entries.items[0];
    if (!entry) {
      throw new Error("No homepage entry found in Contentful.");
    }
    console.log("[Contentful] fetchHomepage: entry found", entry.sys.id);
    const f = entry.fields as any;

    const features: FeatureItem[] = ((f.features as any[]) || [])
      .map((e: any) => ({
        id: e.sys.id,
        title: String(e.fields?.title ?? ""),
        description: String(e.fields?.description ?? ""),
        imagePath: getAssetUrl(e.fields?.image),
        buttonLabel: e.fields?.buttonLabel ? String(e.fields.buttonLabel) : undefined,
        buttonHref: e.fields?.buttonHref ? String(e.fields.buttonHref) : undefined,
        sortOrder: Number(e.fields?.sortOrder ?? 0),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const featuredRecipes: FeaturedRecipe[] = ((f.featuredRecipes as any[]) || [])
      .map((e: any) => ({
        id: e.sys.id,
        title: String(e.fields?.title ?? ""),
        slug: String(e.fields?.slug ?? ""),
        description: String(e.fields?.description ?? ""),
        imagePath: getAssetUrl(e.fields?.image),
        sortOrder: Number(e.fields?.sortOrder ?? 0),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const testimonials: Testimonial[] = ((f.testimonials as any[]) || [])
      .map((e: any) => ({
        id: e.sys.id,
        title: String(e.fields?.title ?? ""),
        text: String(e.fields?.text ?? ""),
        author: String(e.fields?.author ?? ""),
        sortOrder: Number(e.fields?.sortOrder ?? 0),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const legacyHeroImagePath =
      getAssetUrl(f.heroImage) ||
      (typeof f.heroImagePath === "string" ? String(f.heroImagePath) : null);
    const heroImagePaths = [
      ...getAssetUrls(f.heroImages),
      ...(legacyHeroImagePath ? [legacyHeroImagePath] : []),
    ]
      .filter((path, index, arr) => arr.indexOf(path) === index)
      .slice(0, 3);

    const homepageResult = {
      heroTitle: String(f.heroTitle ?? ""),
      heroSubtitle: String(f.heroSubtitle ?? ""),
      heroImagePaths,
      heroImagePath: heroImagePaths[0] || legacyHeroImagePath,
      heroPrimaryCtaLabel: String(f.heroPrimaryCtaLabel ?? ""),
      heroPrimaryCtaHref: String(f.heroPrimaryCtaHref ?? ""),
      heroSecondaryCtaLabel: String(f.heroSecondaryCtaLabel ?? ""),
      heroSecondaryCtaHref: String(f.heroSecondaryCtaHref ?? ""),
      featuresHeading: String(f.featuresHeading ?? ""),
      featuresIntro: String(f.featuresIntro ?? ""),
      features,
      aboutHeading: String(f.aboutHeading ?? ""),
      aboutBodyPrimary: String(f.aboutBodyPrimary ?? ""),
      aboutBodySecondary: String(f.aboutBodySecondary ?? ""),
      aboutBodyTertiary: String(f.aboutBodyTertiary ?? ""),
      aboutBullets: (f.aboutBullets as string[]) || [],
      aboutButtonLabel: String(f.aboutButtonLabel ?? ""),
      aboutButtonHref: f.aboutButtonHref ? String(f.aboutButtonHref) : undefined,
      aboutImagePath: getAssetUrl(f.aboutImage),
      featuredHeading: String(f.featuredHeading ?? ""),
      featuredDescription: f.featuredDescription
        ? String(f.featuredDescription)
        : undefined,
      featuredRecipes,
      testimonialBackgroundPath: getAssetUrl(f.testimonialBackground),
      testimonials,
    };
    console.log("[Contentful] fetchHomepage: result", homepageResult);
    return homepageResult;
  } catch (error) {
    logContentfulFetchError("Error fetching homepage from Contentful:", error);
    throw new Error("Unable to fetch homepage data from Contentful.");
  }
}

async function fetchAboutPageFromContentfulRaw(): Promise<AboutPageData> {
  console.log("[Contentful] fetchAboutPage: start");
  const config = getRequiredContentfulConfig();

  try {
    const client = createContentfulClient(config);
    const entries = await client.getEntries({
      content_type: "aboutPage",
      include: 1,
      limit: 1,
    } as any);
    const entry = entries.items[0];
    if (!entry) {
      throw new Error("No about page entry found in Contentful.");
    }
    console.log("[Contentful] fetchAboutPage: entry found", entry.sys.id);
    const f = entry.fields as any;

    const aboutResult = {
      heroTitle: String(f.heroTitle ?? ""),
      heroBackgroundImagePath: getAssetUrl(f.heroBackgroundImage),
      heroParagraph1: String(f.heroParagraph1 ?? ""),
      heroParagraph2: String(f.heroParagraph2 ?? ""),
      contentImagePath: getAssetUrl(f.contentImage),
      logoImagePath: getAssetUrl(f.logoImage),
      contentHeading: String(f.contentHeading ?? ""),
      contentParagraph1: String(f.contentParagraph1 ?? ""),
      contentParagraph2: String(f.contentParagraph2 ?? ""),
      contentParagraph3: String(f.contentParagraph3 ?? ""),
    };
    console.log("[Contentful] fetchAboutPage: result", aboutResult);
    return aboutResult;
  } catch (error) {
    logContentfulFetchError("Error fetching about page from Contentful:", error);
    throw new Error("Unable to fetch about page data from Contentful.");
  }
}

async function fetchRecipesPageFromContentfulRaw(): Promise<RecipesPageData> {
  console.log("[Contentful] fetchRecipesPage: start");
  const config = getRequiredContentfulConfig();

  try {
    const client = createContentfulClient(config);
    const entries = await client.getEntries({
      content_type: "recipesPage",
      include: 10,
      limit: 1,
    } as any);
    const entry = entries.items[0];
    if (!entry) {
      throw new Error("No recipes page entry found in Contentful.");
    }
    console.log("[Contentful] fetchRecipesPage: entry found", entry.sys.id);
    const result = mapRecipesOrShopPage(entry);
    console.log("[Contentful] fetchRecipesPage: result", result);
    return result;
  } catch (error) {
    logContentfulFetchError("Error fetching recipes page from Contentful:", error);
    throw new Error("Unable to fetch recipes page data from Contentful.");
  }
}

async function fetchShopPageFromContentfulRaw(): Promise<ShopPageData> {
  console.log("[Contentful] fetchShopPage: start");
  const config = getRequiredContentfulConfig();

  try {
    const client = createContentfulClient(config);
    const entries = await client.getEntries({
      content_type: "shopPage",
      include: 10,
      limit: 1,
    } as any);
    const entry = entries.items[0];
    if (!entry) {
      throw new Error("No shop page entry found in Contentful.");
    }
    console.log("[Contentful] fetchShopPage: entry found", entry.sys.id);
    const result = mapRecipesOrShopPage(entry);
    console.log("[Contentful] fetchShopPage: result", result);
    return result;
  } catch (error) {
    logContentfulFetchError("Error fetching shop page from Contentful:", error);
    throw new Error("Unable to fetch shop page data from Contentful.");
  }
}

async function fetchHeaderSettingsFromContentfulRaw(): Promise<HeaderSettings | null> {
  console.log("[Contentful] fetchHeaderSettings: start");
  const config = getRequiredContentfulConfig();

  try {
    const client = createContentfulClient(config);
    const entries = await client.getEntries({
      content_type: "headerSettings",
      limit: 1,
    } as any);
    const entry = entries.items[0];
    if (!entry) {
      console.log("[Contentful] fetchHeaderSettings: no entry found");
      return null;
    }
    console.log("[Contentful] fetchHeaderSettings: entry found", entry.sys.id);
    const f = entry.fields as any;

    const headerResult = {
      promotionBannerEnabled: Boolean(f.promotionBannerEnabled ?? false),
      promotionBannerText: String(f.promotionBannerText ?? ""),
      promotionBannerBackgroundColor: String(
        f.promotionBannerBackgroundColor ?? "#00676E"
      ),
      promotionBannerTextColor: String(f.promotionBannerTextColor ?? "#FFFFFF"),
      promotionBannerLink: String(f.promotionBannerLink ?? ""),
    };
    console.log("[Contentful] fetchHeaderSettings: result", headerResult);
    return headerResult;
  } catch (error) {
    logContentfulFetchError("Error fetching header settings from Contentful:", error);
    throw new Error("Unable to fetch header settings from Contentful.");
  }
}

async function fetchFooterSettingsFromContentfulRaw(): Promise<FooterSettings | null> {
  console.log("[Contentful] fetchFooterSettings: start");
  const config = getRequiredContentfulConfig();

  try {
    const client = createContentfulClient(config);
    const entries = await client.getEntries({
      content_type: "footerSettings",
      limit: 1,
    } as any);
    const entry = entries.items[0];
    if (!entry) {
      console.log("[Contentful] fetchFooterSettings: no entry found");
      return null;
    }
    console.log("[Contentful] fetchFooterSettings: entry found", entry.sys.id);
    const f = entry.fields as any;

    const footerResult = {
      brandDescription: String(f.brandDescription ?? ""),
      newsletterDescription: String(f.newsletterDescription ?? ""),
      quickMenuDescription: String(f.quickMenuDescription ?? ""),
      followUsDescription: String(f.followUsDescription ?? ""),
    };

    console.log("[Contentful] fetchFooterSettings: result", footerResult);
    return footerResult;
  } catch (error) {
    const contentfulError = error as {
      details?: { errors?: { name?: string }[] };
      status?: number;
    };
    const isUnknownContentType =
      contentfulError?.status === 400 &&
      Array.isArray(contentfulError?.details?.errors) &&
      contentfulError.details.errors.some((item) => item?.name === "unknownContentType");

    if (isUnknownContentType) {
      console.warn(
        "Content type 'footerSettings' is missing in Contentful. Using default footer copy."
      );
      return null;
    }

    logContentfulFetchError("Error fetching footer settings from Contentful:", error);
    throw new Error("Unable to fetch footer settings from Contentful.");
  }
}

// ===== CACHED EXPORTS =====

export const fetchHeaderSettingsFromContentful = unstable_cache(
  fetchHeaderSettingsFromContentfulRaw,
  ["contentful-header-settings"],
  { revalidate: 300, tags: ["header-settings"] }
);

export const fetchFooterSettingsFromContentful = unstable_cache(
  fetchFooterSettingsFromContentfulRaw,
  ["contentful-footer-settings"],
  { revalidate: 300, tags: ["footer-settings"] }
);

export const fetchServicesFromContentful = unstable_cache(
  fetchServicesFromContentfulRaw,
  ["contentful-services"],
  { revalidate: 300, tags: ["services"] }
);

export const fetchHomepageFromContentful = unstable_cache(
  fetchHomepageFromContentfulRaw,
  ["contentful-homepage"],
  { revalidate: 300, tags: ["homepage"] }
);

const fetchAboutPageFromContentfulCached = unstable_cache(
  fetchAboutPageFromContentfulRaw,
  ["contentful-about-page"],
  { revalidate: 300, tags: ["about-page"] }
);

export async function fetchAboutPageFromContentful(): Promise<AboutPageData> {
  if (process.env.NODE_ENV !== "production") {
    return fetchAboutPageFromContentfulRaw();
  }

  return fetchAboutPageFromContentfulCached();
}

export const fetchRecipesPageFromContentful = unstable_cache(
  fetchRecipesPageFromContentfulRaw,
  ["contentful-recipes-page"],
  { revalidate: 300, tags: ["recipes-page"] }
);

export const fetchShopPageFromContentful = unstable_cache(
  fetchShopPageFromContentfulRaw,
  ["contentful-shop-page"],
  { revalidate: 300, tags: ["shop-page"] }
);

export const fetchServiceDetailFromContentful = unstable_cache(
  fetchServiceDetailFromContentfulRaw,
  ["contentful-service-detail"],
  { revalidate: 300, tags: ["services"] }
);
