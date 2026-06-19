import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchServiceDetailFromContentful } from "@/lib/contentful-management";
import { buildMetadata } from "@/lib/seo";
import BookingPageClient from "./booking-page-client";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await fetchServiceDetailFromContentful(slug);

  return buildMetadata({
    title: service ? `Book ${service.title}` : "Book Service",
    description: "Booking request page for WaistLess Foods services.",
    path: `/services/${slug}/book`,
    noIndex: true,
    image: service?.mainImagePath || service?.imagePath || null,
  });
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const contentfulService = await fetchServiceDetailFromContentful(slug);

  if (!contentfulService) {
    notFound();
  }

  const serviceTitle = contentfulService.title;
  const howToBook = contentfulService.howToBook;
  const bookingImagePath =
    contentfulService.mainImagePath || contentfulService.imagePath;

  return (
    <BookingPageClient
      serviceSlug={slug}
      serviceTitle={serviceTitle}
      howToBook={howToBook}
      bookingImagePath={bookingImagePath}
    />
  );
}
