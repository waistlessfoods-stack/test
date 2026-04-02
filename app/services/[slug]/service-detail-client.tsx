"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Star } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Review = {
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
  const [visibleCount, setVisibleCount] = useState(2);
  const [mainImage, setMainImage] = useState(service.images.main);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 md:py-10 bg-white">
      <Breadcrumb className="w-full max-w-[315px] h-7 mb-6 md:mb-8">
        <BreadcrumbList className="font-sans font-medium text-base md:text-lg leading-6 text-black">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/services">Our Service</Link>
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
          <div className="relative w-full lg:w-[520px] aspect-[5/6] rounded-[16px] overflow-hidden">
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
                className={`relative aspect-square rounded-[16px] overflow-hidden cursor-pointer transition-all group hover:ring-2 hover:ring-primary ${
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
            <h2 className="font-sans font-medium text-lg md:text-xl text-black mb-4">
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
              <button className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-100 transition">
                Write a review
              </button>
            </div>

            <div className="space-y-3">
              {service.reviews.items
                .slice(0, visibleCount)
                .map((review, idx) => (
                  <div
                    key={`${review.name}-${idx}`}
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

          <div className="flex flex-col gap-6">
            <article className="flex flex-col gap-3">
              <h2 className="font-sans font-medium text-lg md:text-xl leading-7 tracking-tight text-black uppercase">
                Description
              </h2>
              <p className="font-sans font-normal text-base md:text-lg leading-relaxed text-[#878787]">
                {service.description}
              </p>
            </article>

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
          </div>

          <Link
            href={`/services/${service.slug}/book`}
            className="w-[132px] h-12 flex items-center justify-center bg-[#388082] rounded-[14px] hover:opacity-90 transition-all active:scale-95"
          >
            <span className="font-['Helvetica_Neue'] font-medium text-base md:text-lg leading-[110%] tracking-tight text-white">
              Book now
            </span>
          </Link>
        </section>
      </div>
    </main>
  );
}
