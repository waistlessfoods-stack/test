"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUp, Star } from "lucide-react";
import ReviewDialog from "@/components/review-dialog";
import type {
  ServiceDetailSection,
  ServiceDetailSectionsData,
} from "@/lib/contentful-management";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Review = {
  id?: number;
  name: string;
  rating: number;
  date: string;
  comment: string;
};

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
    items: Review[];
  };
};

type ServiceDetailClientProps = {
  service: ServiceDetail;
};

export default function ServiceDetailClient({
  service,
}: ServiceDetailClientProps) {
  const serviceKey = `${service.slug}:${service.images.main ?? ""}`;

  return <ServiceDetailContent key={serviceKey} service={service} />;
}

function ServiceDetailContent({ service }: ServiceDetailClientProps) {
  const [visibleCount, setVisibleCount] = useState(2);
  const [mainImage, setMainImage] = useState(service.images.main);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const reviewsHeadingRef = useRef<HTMLHeadingElement>(null);
  const detailSections = service.detailSections?.sections ?? [];
  const hasDetailSections = detailSections.length > 0;

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 md:py-10 bg-white">
      <Breadcrumb className="w-full max-w-[315px] h-7 mb-6 md:mb-8">
        <BreadcrumbList className="font-sans font-medium text-base md:text-lg leading-6 text-black">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/services">Our Services</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-black" />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-black">
              {service.breadcrumbLabel}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
        <section className="w-full lg:w-[520px] flex flex-col gap-4">
          <div className="relative w-full lg:w-[520px] aspect-[5/6] rounded-none overflow-hidden">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={`${service.title} main image`}
                fill
                sizes="(max-width: 1024px) 100vw, 520px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 lg:gap-3 w-full lg:w-[520px]">
            {service.images.gallery.map((image, index) => (
              <div
                key={`${image}-${index}`}
                onClick={() => image && setMainImage(image)}
                className={`relative aspect-square rounded-none overflow-hidden cursor-pointer transition-all group hover:ring-2 hover:ring-primary ${
                  mainImage === image ? "ring-2 ring-primary" : ""
                }`}
              >
                {image ? (
                  <Image
                    src={image}
                    alt={`${service.title} gallery image ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 25vw, 97px"
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 w-full lg:w-[520px]">
            <h2
              ref={reviewsHeadingRef}
              className="font-sans font-medium text-lg md:text-xl text-black mb-4 scroll-mt-28"
            >
              Ratings & Reviews
            </h2>

            <div className="bg-gray-50 rounded-md p-4 mb-4 flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-semibold text-black">
                    {service.reviews.averageRating}
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.round(service.reviews.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Based on {service.reviews.totalReviews} reviews
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewDialogOpen(true)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-100 transition"
              >
                Write a review
              </button>
            </div>

            <div className="space-y-3">
              {service.reviews.items
                .slice(0, visibleCount)
                .map((review, idx) => (
                  <div
                    key={review.id ?? `${review.name}-${idx}`}
                    className="border border-gray-100 rounded-md p-4 hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-black">
                          {review.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {review.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
            </div>

            {visibleCount < service.reviews.items.length && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 2)}
                className="w-full mt-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition"
              >
                Load more reviews
              </button>
            )}

            {visibleCount > 2 && (
              <button
                type="button"
                onClick={() =>
                  reviewsHeadingRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className="mx-auto mt-3 flex items-center gap-1.5 text-sm font-medium text-[#388082] hover:text-[#2e6b6d]"
              >
                <ArrowUp className="h-4 w-4" />
                Back to reviews
              </button>
            )}
          </div>
        </section>

        <section className="w-full lg:w-[620px] flex flex-col gap-8 lg:gap-10">
          <header className="flex flex-col gap-4 max-w-[513px]">
            <h1 className="font-sans font-medium text-3xl md:text-4xl leading-tight tracking-tight text-black">
              {service.title}
            </h1>
            <div className="w-fit flex items-center px-4 py-2.5 gap-2 border border-[#848484] rounded-[100px]">
              <span className="font-sans font-medium text-lg md:text-xl leading-6 tracking-tight text-black">
                {service.priceText}
              </span>
            </div>
          </header>

          <div className="flex flex-col gap-8">
            <article className="flex flex-col gap-3">
              <p className="font-sans font-normal text-base md:text-lg leading-relaxed text-[#424242]">
                {service.description}
              </p>
            </article>

            {hasDetailSections ? (
              <ServiceSections sections={detailSections} />
            ) : (
              <LegacyServiceSections service={service} />
            )}
          </div>

          <Link
            href={`/services/${service.slug}/book`}
            className="w-[132px] h-12 flex items-center justify-center bg-[#388082] rounded-[14px] hover:opacity-90 transition-all active:scale-95"
          >
            <span className="font-['Helvetica_Neue'] font-medium text-base md:text-lg leading-[110%] tracking-tight text-white">
              Book now
            </span>
          </Link>

          <section className="flex flex-col gap-4 border-t border-gray-100 pt-6">
            <h2 className="font-sans font-medium text-lg md:text-xl leading-7 tracking-tight text-black uppercase">
              Keep Exploring
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                href="/services"
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-800 transition hover:border-[#388082] hover:bg-white"
              >
                Browse all services
              </Link>
              <Link
                href="/recipes"
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-800 transition hover:border-[#388082] hover:bg-white"
              >
                Explore recipes
              </Link>
              <Link
                href="/blog"
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-800 transition hover:border-[#388082] hover:bg-white"
              >
                Read the blog
              </Link>
            </div>
          </section>
        </section>
      </div>

      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        serviceSlug={service.slug}
        serviceTitle={service.title}
      />
    </main>
  );
}

function ServiceSections({ sections }: { sections: ServiceDetailSection[] }) {
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section, sectionIndex) => {
        const isDetailList = section.variant === "detail-list";

        return (
          <section
            key={section.id || `${section.title}-${sectionIndex}`}
            className={`flex flex-col gap-4 ${
              sectionIndex > 0 ? "border-t border-[#D7D4CF] pt-7" : ""
            }`}
          >
            <h2 className="font-sans text-xl font-semibold leading-snug tracking-tight text-[#111111] md:text-2xl">
              {section.title}
            </h2>

            {isDetailList ? (
              <ul className="list-disc space-y-2 pl-5 font-sans text-base leading-7 text-[#424242] md:text-lg md:leading-8">
                {section.items.map((item, itemIndex) => (
                  <li key={`${section.title}-${item.body}-${itemIndex}`}>
                    {item.body || item.subtitle}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col gap-5">
                {section.items.map((item, itemIndex) => (
                  <article
                    key={`${section.title}-${item.subtitle}-${itemIndex}`}
                    className="flex flex-col gap-2"
                  >
                    {item.subtitle ? (
                      <h3 className="font-sans text-base font-semibold leading-snug text-[#00676E] md:text-lg">
                        {item.subtitle}
                      </h3>
                    ) : null}
                    {item.body ? (
                      <p className="font-sans text-sm leading-7 text-[#4A4A4A] md:text-base">
                        {item.body}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function LegacyServiceSections({ service }: ServiceDetailClientProps) {
  return (
    <div className="flex flex-col gap-6">
      {service.benefits.length > 0 && (
        <article className="flex flex-col gap-3">
          <h2 className="font-sans font-medium text-lg md:text-xl leading-7 tracking-tight text-black uppercase">
            Benefits
          </h2>
          <ul className="list-disc list-inside font-sans font-normal text-base md:text-lg leading-relaxed text-[#878787]">
            {service.benefits.map((item, index) => (
              <li key={`${index}-${item}`}>{item}</li>
            ))}
          </ul>
        </article>
      )}

      {service.includes.length > 0 && (
        <article className="flex flex-col gap-3">
          <h2 className="font-sans font-medium text-lg md:text-xl leading-7 tracking-tight text-black uppercase">
            Includes
          </h2>
          <ul className="list-disc list-inside font-sans font-normal text-base md:text-lg leading-relaxed text-[#878787]">
            {service.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      )}

      {service.howToBook.length > 0 && (
        <article className="flex flex-col gap-3">
          <h2 className="font-sans font-medium text-lg md:text-xl leading-7 tracking-tight text-black uppercase">
            How to Book
          </h2>
          <ol className="list-decimal list-inside font-sans font-normal text-base md:text-lg leading-relaxed text-[#878787]">
            {service.howToBook.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>
      )}
    </div>
  );
}
