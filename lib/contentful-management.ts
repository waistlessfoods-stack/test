import { createClient } from "contentful-management";
import { unstable_cache } from "next/cache";

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

// Homepage Types
export type FeatureItem = {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  buttonLabel?: string;
  buttonHref?: string;
  sortOrder: number;
};

export type FeaturedRecipe = {
  id: string;
  title: string;
  slug: string;
  description: string;
  imagePath: string;
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
  heroImagePath: string;
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
  aboutImagePath: string;
  featuredHeading: string;
  featuredRecipes: FeaturedRecipe[];
  testimonialBackgroundPath: string;
  testimonials: Testimonial[];
};

// Helper to extract asset URL
const getAssetUrl = (asset: any): string => {
  if (!asset) return "";
  const file = asset.fields?.file?.[DEFAULT_LOCALE];
  if (!file?.url) return "";
  return file.url.startsWith("//") ? `https:${file.url}` : file.url;
};

// Header Settings Types
export type HeaderSettings = {
  promotionBannerEnabled: boolean;
  promotionBannerText: string;
  promotionBannerBackgroundColor: string;
  promotionBannerTextColor: string;
  promotionBannerLink: string;
};

// About Page Types
export type AboutPageData = {
  heroTitle: string;
  heroBackgroundImagePath: string;
  heroParagraph1: string;
  heroParagraph2: string;
  contentImagePath: string;
  logoImagePath: string;
  contentHeading: string;
  contentParagraph1: string;
  contentParagraph2: string;
  contentParagraph3: string;
};

// Recipes Page Types
export type RecipeCategory = {
  id: string;
  name: string;
  imagePath: string;
  sortOrder: number;
};

export type Recipe = {
  id: string;
  slug: string;
  title: string;
  price: string;
  description: string;
  imagePath: string;
  sortOrder: number;
  categoryId?: string;
  featured?: boolean;
};

// Helper function to generate URL-friendly slugs
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type RecipesPageData = {
  bannerImagePath: string;
  bannerTitle: string;
  bannerDescription: string;
  bannerFeaturedImage1Path: string;
  bannerFeaturedImage2Path: string;
  categories: RecipeCategory[];
  recipes: Recipe[];
};

// Helper mappers
const mapFeatureItem = async (
  entry: {
    sys: { id: string };
    fields: Record<string, Record<string, unknown>>;
  },
  environment: any
): Promise<FeatureItem> => {
  const fields = entry.fields;
  
  // Get image asset
  let imagePath = "";
  const imageRef = fields.image?.[DEFAULT_LOCALE] as any;
  if (imageRef?.sys?.id) {
    try {
      const asset = await environment.getAsset(imageRef.sys.id);
      imagePath = getAssetUrl(asset);
    } catch (error) {
      console.error(`Failed to fetch asset ${imageRef.sys.id}:`, error);
    }
  }
  
  return {
    id: entry.sys.id,
    title: String(fields.title?.[DEFAULT_LOCALE] ?? ""),
    description: String(fields.description?.[DEFAULT_LOCALE] ?? ""),
    imagePath,
    buttonLabel: fields.buttonLabel?.[DEFAULT_LOCALE]
      ? String(fields.buttonLabel[DEFAULT_LOCALE])
      : undefined,
    buttonHref: fields.buttonHref?.[DEFAULT_LOCALE]
      ? String(fields.buttonHref[DEFAULT_LOCALE])
      : undefined,
    sortOrder: Number(fields.sortOrder?.[DEFAULT_LOCALE] ?? 0),
  };
};

const mapFeaturedRecipe = async (
  entry: {
    sys: { id: string };
    fields: Record<string, Record<string, unknown>>;
  },
  environment: any
): Promise<FeaturedRecipe> => {
  const fields = entry.fields;
  
  // Get image asset
  let imagePath = "";
  const imageRef = fields.image?.[DEFAULT_LOCALE] as any;
  if (imageRef?.sys?.id) {
    try {
      const asset = await environment.getAsset(imageRef.sys.id);
      imagePath = getAssetUrl(asset);
    } catch (error) {
      console.error(`Failed to fetch asset ${imageRef.sys.id}:`, error);
    }
  }
  
  return {
    id: entry.sys.id,
    title: String(fields.title?.[DEFAULT_LOCALE] ?? ""),
    slug: String(fields.slug?.[DEFAULT_LOCALE] ?? ""),
    description: String(fields.description?.[DEFAULT_LOCALE] ?? ""),
    imagePath,
    sortOrder: Number(fields.sortOrder?.[DEFAULT_LOCALE] ?? 0),
  };
};

const mapTestimonial = (entry: {
  sys: { id: string };
  fields: Record<string, Record<string, unknown>>;
}): Testimonial => {
  const fields = entry.fields;
  return {
    id: entry.sys.id,
    title: String(fields.title?.[DEFAULT_LOCALE] ?? ""),
    text: String(fields.text?.[DEFAULT_LOCALE] ?? ""),
    author: String(fields.author?.[DEFAULT_LOCALE] ?? ""),
    sortOrder: Number(fields.sortOrder?.[DEFAULT_LOCALE] ?? 0),
  };
};

// Fetch homepage data from Contentful
export async function fetchHomepageFromContentful(): Promise<HomepageData | null> {
  const config = getContentfulConfig();
  if (!config) {
    return null;
  }

  try {
    const client = createClient({ accessToken: config.accessToken });
    const space = await client.getSpace(config.spaceId);
    const environment = await space.getEnvironment(config.environmentId);

    // Fetch the homepage entry
    const entries = await environment.getEntries({
      content_type: "homepage",
      limit: 1,
    });

    const entry = entries.items[0];
    if (!entry) {
      return null;
    }

    const fields = entry.fields;

    // Fetch asset URLs for images
    let heroImagePath = "";
    const heroImageRef = fields.heroImage?.[DEFAULT_LOCALE] as any;
    if (heroImageRef?.sys?.id) {
      try {
        const asset = await environment.getAsset(heroImageRef.sys.id);
        heroImagePath = getAssetUrl(asset);
      } catch (error) {
        console.error(`Failed to fetch hero image:`, error);
      }
    }

    let aboutImagePath = "";
    const aboutImageRef = fields.aboutImage?.[DEFAULT_LOCALE] as any;
    if (aboutImageRef?.sys?.id) {
      try {
        const asset = await environment.getAsset(aboutImageRef.sys.id);
        aboutImagePath = getAssetUrl(asset);
      } catch (error) {
        console.error(`Failed to fetch about image:`, error);
      }
    }

    let testimonialBackgroundPath = "";
    const testimonialBgRef = fields.testimonialBackground?.[DEFAULT_LOCALE] as any;
    if (testimonialBgRef?.sys?.id) {
      try {
        const asset = await environment.getAsset(testimonialBgRef.sys.id);
        testimonialBackgroundPath = getAssetUrl(asset);
      } catch (error) {
        console.error(`Failed to fetch testimonial background:`, error);
      }
    }

    // Map features - fetch linked entries manually
    const featureRefs = (fields.features?.[DEFAULT_LOCALE] as any[]) || [];
    const features: FeatureItem[] = [];
    for (const ref of featureRefs) {
      try {
        const linkedEntry = await environment.getEntry(ref.sys.id);
        features.push(await mapFeatureItem(linkedEntry as any, environment));
      } catch (error) {
        console.error(`Failed to fetch feature item ${ref.sys.id}:`, error);
      }
    }

    // Map featured recipes - fetch linked entries manually
    const recipeRefs = (fields.featuredRecipes?.[DEFAULT_LOCALE] as any[]) || [];
    const featuredRecipes: FeaturedRecipe[] = [];
    for (const ref of recipeRefs) {
      try {
        const linkedEntry = await environment.getEntry(ref.sys.id);
        featuredRecipes.push(await mapFeaturedRecipe(linkedEntry as any, environment));
      } catch (error) {
        console.error(`Failed to fetch featured recipe ${ref.sys.id}:`, error);
      }
    }

    // Map testimonials - fetch linked entries manually
    const testimonialRefs = (fields.testimonials?.[DEFAULT_LOCALE] as any[]) || [];
    const testimonials: Testimonial[] = [];
    for (const ref of testimonialRefs) {
      try {
        const linkedEntry = await environment.getEntry(ref.sys.id);
        testimonials.push(mapTestimonial(linkedEntry as any));
      } catch (error) {
        console.error(`Failed to fetch testimonial ${ref.sys.id}:`, error);
      }
    }

    // Sort by sortOrder
    features.sort((a, b) => a.sortOrder - b.sortOrder);
    featuredRecipes.sort((a, b) => a.sortOrder - b.sortOrder);
    testimonials.sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      heroTitle: String(fields.heroTitle?.[DEFAULT_LOCALE] ?? ""),
      heroSubtitle: String(fields.heroSubtitle?.[DEFAULT_LOCALE] ?? ""),
      heroImagePath,
      heroPrimaryCtaLabel: String(fields.heroPrimaryCtaLabel?.[DEFAULT_LOCALE] ?? ""),
      heroPrimaryCtaHref: String(fields.heroPrimaryCtaHref?.[DEFAULT_LOCALE] ?? ""),
      heroSecondaryCtaLabel: String(fields.heroSecondaryCtaLabel?.[DEFAULT_LOCALE] ?? ""),
      heroSecondaryCtaHref: String(fields.heroSecondaryCtaHref?.[DEFAULT_LOCALE] ?? ""),
      featuresHeading: String(fields.featuresHeading?.[DEFAULT_LOCALE] ?? ""),
      featuresIntro: String(fields.featuresIntro?.[DEFAULT_LOCALE] ?? ""),
      features,
      aboutHeading: String(fields.aboutHeading?.[DEFAULT_LOCALE] ?? ""),
      aboutBodyPrimary: String(fields.aboutBodyPrimary?.[DEFAULT_LOCALE] ?? ""),
      aboutBodySecondary: String(fields.aboutBodySecondary?.[DEFAULT_LOCALE] ?? ""),
      aboutBodyTertiary: String(fields.aboutBodyTertiary?.[DEFAULT_LOCALE] ?? ""),
      aboutBullets: (fields.aboutBullets?.[DEFAULT_LOCALE] as string[]) || [],
      aboutButtonLabel: String(fields.aboutButtonLabel?.[DEFAULT_LOCALE] ?? ""),
      aboutButtonHref: fields.aboutButtonHref?.[DEFAULT_LOCALE]
        ? String(fields.aboutButtonHref[DEFAULT_LOCALE])
        : undefined,
      aboutImagePath,
      featuredHeading: String(fields.featuredHeading?.[DEFAULT_LOCALE] ?? ""),
      featuredRecipes,
      testimonialBackgroundPath,
      testimonials,
    };
  } catch (error) {
    console.error("Error fetching homepage from Contentful:", error);
    return null;
  }
}

// Fetch about page data from Contentful
export async function fetchAboutPageFromContentful(): Promise<AboutPageData | null> {
  const config = getContentfulConfig();
  if (!config) {
    return null;
  }

  try {
    const client = createClient({ accessToken: config.accessToken });
    const space = await client.getSpace(config.spaceId);
    const environment = await space.getEnvironment(config.environmentId);

    // Fetch the about page entry
    const entries = await environment.getEntries({
      content_type: "aboutPage",
      limit: 1,
    });

    const entry = entries.items[0];
    if (!entry) {
      return null;
    }

    const fields = entry.fields;

    // Fetch asset URLs for images
    let heroBackgroundImagePath = "";
    const heroBackgroundRef = fields.heroBackgroundImage?.[DEFAULT_LOCALE] as any;
    if (heroBackgroundRef?.sys?.id) {
      try {
        const asset = await environment.getAsset(heroBackgroundRef.sys.id);
        heroBackgroundImagePath = getAssetUrl(asset);
      } catch (error) {
        console.error(`Failed to fetch hero background image:`, error);
      }
    }

    let contentImagePath = "";
    const contentImageRef = fields.contentImage?.[DEFAULT_LOCALE] as any;
    if (contentImageRef?.sys?.id) {
      try {
        const asset = await environment.getAsset(contentImageRef.sys.id);
        contentImagePath = getAssetUrl(asset);
      } catch (error) {
        console.error(`Failed to fetch content image:`, error);
      }
    }

    let logoImagePath = "";
    const logoImageRef = fields.logoImage?.[DEFAULT_LOCALE] as any;
    if (logoImageRef?.sys?.id) {
      try {
        const asset = await environment.getAsset(logoImageRef.sys.id);
        logoImagePath = getAssetUrl(asset);
      } catch (error) {
        console.error(`Failed to fetch logo image:`, error);
      }
    }

    return {
      heroTitle: String(fields.heroTitle?.[DEFAULT_LOCALE] ?? ""),
      heroBackgroundImagePath,
      heroParagraph1: String(fields.heroParagraph1?.[DEFAULT_LOCALE] ?? ""),
      heroParagraph2: String(fields.heroParagraph2?.[DEFAULT_LOCALE] ?? ""),
      contentImagePath,
      logoImagePath,
      contentHeading: String(fields.contentHeading?.[DEFAULT_LOCALE] ?? ""),
      contentParagraph1: String(fields.contentParagraph1?.[DEFAULT_LOCALE] ?? ""),
      contentParagraph2: String(fields.contentParagraph2?.[DEFAULT_LOCALE] ?? ""),
      contentParagraph3: String(fields.contentParagraph3?.[DEFAULT_LOCALE] ?? ""),
    };
  } catch (error) {
    console.error("Error fetching about page from Contentful:", error);
    return null;
  }
}

// Fetch recipes page data from Contentful
export async function fetchRecipesPageFromContentful(): Promise<RecipesPageData | null> {
  const config = getContentfulConfig();
  if (!config) {
    return null;
  }

  try {
    const client = createClient({ accessToken: config.accessToken });
    const space = await client.getSpace(config.spaceId);
    const environment = await space.getEnvironment(config.environmentId);

    // Fetch the recipes page entry
    const entries = await environment.getEntries({
      content_type: "recipesPage",
      limit: 1,
    });

    const entry = entries.items[0];
    if (!entry) {
      return null;
    }

    const fields = entry.fields;

    // Fetch asset URLs for images
    let bannerImagePath = "";
    const bannerImageRef = fields.bannerImage?.[DEFAULT_LOCALE] as any;
    if (bannerImageRef?.sys?.id) {
      try {
        const asset = await environment.getAsset(bannerImageRef.sys.id);
        bannerImagePath = getAssetUrl(asset);
      } catch (error) {
        console.error(`Failed to fetch banner image:`, error);
      }
    }

    let bannerFeaturedImage1Path = "";
    const bannerFeaturedImage1Ref = fields.bannerFeaturedImage1?.[DEFAULT_LOCALE] as any;
    if (bannerFeaturedImage1Ref?.sys?.id) {
      try {
        const asset = await environment.getAsset(bannerFeaturedImage1Ref.sys.id);
        bannerFeaturedImage1Path = getAssetUrl(asset);
      } catch (error) {
        console.error(`Failed to fetch banner featured image 1:`, error);
      }
    }

    let bannerFeaturedImage2Path = "";
    const bannerFeaturedImage2Ref = fields.bannerFeaturedImage2?.[DEFAULT_LOCALE] as any;
    if (bannerFeaturedImage2Ref?.sys?.id) {
      try {
        const asset = await environment.getAsset(bannerFeaturedImage2Ref.sys.id);
        bannerFeaturedImage2Path = getAssetUrl(asset);
      } catch (error) {
        console.error(`Failed to fetch banner featured image 2:`, error);
      }
    }

    // Map categories
    const categoryRefs = (fields.categories?.[DEFAULT_LOCALE] as any[]) || [];
    const categories: RecipeCategory[] = [];
    for (const ref of categoryRefs) {
      try {
        const linkedEntry = await environment.getEntry(ref.sys.id);
        const catFields = linkedEntry.fields;
        
        let categoryImagePath = "";
        const categoryImageRef = catFields.image?.[DEFAULT_LOCALE] as any;
        if (categoryImageRef?.sys?.id) {
          try {
            const asset = await environment.getAsset(categoryImageRef.sys.id);
            categoryImagePath = getAssetUrl(asset);
          } catch (error) {
            console.error(`Failed to fetch category image:`, error);
          }
        }
        
        categories.push({
          id: linkedEntry.sys.id,
          name: String(catFields.name?.[DEFAULT_LOCALE] ?? ""),
          imagePath: categoryImagePath,
          sortOrder: Number(catFields.sortOrder?.[DEFAULT_LOCALE] ?? 0),
        });
      } catch (error) {
        console.error(`Failed to fetch category ${ref.sys.id}:`, error);
      }
    }

    // Map recipes
    const recipeRefs = (fields.recipes?.[DEFAULT_LOCALE] as any[]) || [];
    const recipes: Recipe[] = [];
    for (const ref of recipeRefs) {
      try {
        const linkedEntry = await environment.getEntry(ref.sys.id);
        const recipeFields = linkedEntry.fields;
        
        let recipeImagePath = "";
        const recipeImageRef = recipeFields.image?.[DEFAULT_LOCALE] as any;
        if (recipeImageRef?.sys?.id) {
          try {
            const asset = await environment.getAsset(recipeImageRef.sys.id);
            recipeImagePath = getAssetUrl(asset);
          } catch (error) {
            console.error(`Failed to fetch recipe image:`, error);
          }
        }
        
        const title = String(recipeFields.title?.[DEFAULT_LOCALE] ?? "");
        recipes.push({
          id: linkedEntry.sys.id,
          slug: generateSlug(title),
          title,
          price: String(recipeFields.price?.[DEFAULT_LOCALE] ?? ""),
          description: String(recipeFields.description?.[DEFAULT_LOCALE] ?? ""),
          imagePath: recipeImagePath,
          sortOrder: Number(recipeFields.sortOrder?.[DEFAULT_LOCALE] ?? 0),
          categoryId: recipeFields.category?.[DEFAULT_LOCALE]?.sys?.id,
          featured: Boolean(recipeFields.featured?.[DEFAULT_LOCALE] ?? false),
        });
      } catch (error) {
        console.error(`Failed to fetch recipe ${ref.sys.id}:`, error);
      }
    }

    // Sort by sortOrder
    categories.sort((a, b) => a.sortOrder - b.sortOrder);
    recipes.sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      bannerImagePath,
      bannerTitle: String(fields.bannerTitle?.[DEFAULT_LOCALE] ?? ""),
      bannerDescription: String(fields.bannerDescription?.[DEFAULT_LOCALE] ?? ""),
      bannerFeaturedImage1Path,
      bannerFeaturedImage2Path,
      categories,
      recipes,
    };
  } catch (error) {
    console.error("Error fetching recipes page from Contentful:", error);
    return null;
  }
}

async function fetchHeaderSettingsFromContentfulRaw(): Promise<HeaderSettings | null> {
  const config = getContentfulConfig();
  if (!config) {
    return null;
  }

  try {
    const client = createClient({ accessToken: config.accessToken });
    const space = await client.getSpace(config.spaceId);
    const environment = await space.getEnvironment(config.environmentId);

    // Fetch the header settings entry
    const entries = await environment.getEntries({
      content_type: "headerSettings",
      limit: 1,
    });

    const entry = entries.items[0];
    if (!entry) {
      return null;
    }

    const fields = entry.fields;

    return {
      promotionBannerEnabled: Boolean(fields.promotionBannerEnabled?.[DEFAULT_LOCALE] ?? false),
      promotionBannerText: String(fields.promotionBannerText?.[DEFAULT_LOCALE] ?? ""),
      promotionBannerBackgroundColor: String(fields.promotionBannerBackgroundColor?.[DEFAULT_LOCALE] ?? "#00676E"),
      promotionBannerTextColor: String(fields.promotionBannerTextColor?.[DEFAULT_LOCALE] ?? "#FFFFFF"),
      promotionBannerLink: String(fields.promotionBannerLink?.[DEFAULT_LOCALE] ?? ""),
    };
  } catch (error) {
    console.error("Error fetching header settings from Contentful:", error);
    return null;
  }
}

// Cached with ISR-style time-based revalidation for the header banner.
export const fetchHeaderSettingsFromContentful = unstable_cache(
  fetchHeaderSettingsFromContentfulRaw,
  ["contentful-header-settings"],
  { revalidate: 300, tags: ["header-settings"] }
);
