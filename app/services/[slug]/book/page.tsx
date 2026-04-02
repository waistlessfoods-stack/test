import { notFound } from "next/navigation";
import { fetchServiceDetailFromContentful } from "@/lib/contentful-management";
import BookingPageClient from "./booking-page-client";

export const revalidate = 300;

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
