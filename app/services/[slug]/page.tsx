import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/json-ld";
import {
  fetchServiceDetailFromContentful,
  type ServiceDetailSectionsData,
} from "@/lib/contentful-management";
import { buildMetadata, toAbsoluteUrl } from "@/lib/seo";
import {
  fetchApprovedServiceReviews,
  type ApprovedServiceReview,
} from "@/lib/service-reviews";
import ServiceDetailClient from "./service-detail-client";

// Review moderation must be reflected immediately. Contentful fetchers retain
// their own cache, while the approved review query runs for every page request.
export const dynamic = "force-dynamic";

type ServiceDetail = {
  slug: string;
  title: string;
  breadcrumbLabel: string;
  priceText: string;
  description: string;
  benefits: string[];
  detailSections: ServiceDetailSectionsData | null;
  includes: string[];
  howToBook: string[];
  images: {
    main: string | null;
    gallery: (string | null)[];
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    items: Array<{
      id?: number;
      name: string;
      rating: number;
      date: string;
      comment: string;
    }>;
  };
};

const toServiceDetail = (entry: {
  slug: string;
  title: string;
  breadcrumbLabel: string;
  priceText: string;
  description: string;
  benefits: string[];
  detailDescription: string;
  detailBenefits: string[];
  detailSections: ServiceDetailSectionsData | null;
  includes: string[];
  howToBook: string[];
  mainImagePath: string | null;
  imagePath: string | null;
  galleryImagePaths: string[];
  reviews: unknown;
}, approvedReviews: ApprovedServiceReview[] = []): ServiceDetail => {
  const approvedRatingTotal = approvedReviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );
  const approvedAverage = approvedReviews.length
    ? Number((approvedRatingTotal / approvedReviews.length).toFixed(1))
    : 0;

  return {
    slug: entry.slug,
    title: entry.title,
    breadcrumbLabel: entry.breadcrumbLabel || entry.title,
    priceText: entry.priceText,
    description: entry.detailDescription || entry.description,
    benefits: entry.detailBenefits.length ? entry.detailBenefits : entry.benefits,
    detailSections: entry.detailSections,
    includes: entry.includes,
    howToBook: entry.howToBook,
    images: {
      main: entry.mainImagePath || entry.imagePath,
      gallery: entry.galleryImagePaths.length
        ? entry.galleryImagePaths
        : [entry.imagePath].filter(Boolean),
    },
    reviews: {
      averageRating: approvedAverage,
      totalReviews: approvedReviews.length,
      items: approvedReviews,
    },
  };
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await fetchServiceDetailFromContentful(slug);

  if (!service) {
    return buildMetadata({
      title: "Service Not Found",
      description: "This service could not be found.",
      path: `/services/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: service.title,
    description: service.detailDescription || service.description,
    path: `/services/${service.slug}`,
    image: service.mainImagePath || service.imagePath,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [contentfulService, approvedReviews] = await Promise.all([
    fetchServiceDetailFromContentful(slug),
    fetchApprovedServiceReviews(slug),
  ]);
  if (!contentfulService) {
    notFound();
  }

  const service = toServiceDetail(contentfulService, approvedReviews);
  const serviceUrl = toAbsoluteUrl(`/services/${service.slug}`);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.title,
      description: service.description,
      url: serviceUrl,
      image: service.images.main || undefined,
      provider: {
        "@type": "Organization",
        name: "WaistLess Foods",
        url: toAbsoluteUrl("/"),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: toAbsoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Services",
          item: toAbsoluteUrl("/services"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: service.breadcrumbLabel,
          item: serviceUrl,
        },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <ServiceDetailClient service={service} />
    </>
  );
}
