import type { Metadata } from "next";

const SITE_NAME = "WaistLess Foods";
const PRODUCTION_SITE_URL = "https://www.waistlessfoods.com";
const LOCAL_SITE_URL = "http://localhost:3000";
const DEFAULT_DESCRIPTION =
  "Private Chef Amber curates fresh, flavorful meals, from pescatarian feasts to hearty family dinners, with an eco-conscious touch.";

type BuildMetadataOptions = {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
  noIndex?: boolean;
  openGraphType?: "website" | "article";
};

function isPreviewEnvironment(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

function normalizeBaseUrl(value: string | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;

  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;

  return withProtocol.replace(/\/+$/, "");
}

function isLocalUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function getBaseUrl(): string {
  const configuredUrl =
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  const isProductionBuild =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview";

  if (configuredUrl && !(isProductionBuild && isLocalUrl(configuredUrl))) {
    return configuredUrl;
  }

  return isProductionBuild ? PRODUCTION_SITE_URL : LOCAL_SITE_URL;
}

export function toAbsoluteUrl(pathname: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${pathname === "/" ? "" : pathname}`;
}

function toAbsoluteImageUrl(image: string | null | undefined): string | undefined {
  if (!image) {
    return undefined;
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${getBaseUrl()}${image.startsWith("/") ? image : `/${image}`}`;
}

function withSiteName(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
  noIndex = false,
  openGraphType = "website",
}: BuildMetadataOptions): Metadata {
  const absoluteUrl = toAbsoluteUrl(path);
  const absoluteImage = toAbsoluteImageUrl(image || "/opengraph-image");
  const fullTitle = withSiteName(title);
  const shouldNoIndex = noIndex || isPreviewEnvironment();

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: absoluteUrl,
    },
    robots: shouldNoIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      type: openGraphType,
      url: absoluteUrl,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: absoluteImage
        ? [
            {
              url: absoluteImage,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: absoluteImage ? [absoluteImage] : undefined,
    },
  };
}

export function buildNoIndexMetadata(
  title: string,
  description = DEFAULT_DESCRIPTION
): Metadata {
  return buildMetadata({
    title,
    description,
    path: "/",
    noIndex: true,
  });
}

export { DEFAULT_DESCRIPTION, SITE_NAME };
