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
  title: string;
  breadcrumbLabel: string;
  priceText: string;
  description: string;
  includes: string[];
  howToBook: string[];
  images: {
    main: string;
    gallery: string[];
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

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 md:py-16 bg-white min-h-screen">
      <Breadcrumb className="w-full max-w-[315px] h-7 mb-[53px]">
        <BreadcrumbList className="font-sans font-medium text-[22px] leading-7 tracking-[-2%] text-black">
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

      <div className="flex flex-col lg:flex-row gap-[53px] items-start">
        <section className="w-full lg:w-[557px] flex flex-col gap-[25px]">
          <div className="relative w-full lg:w-[557px] aspect-557/642 rounded-[12px] overflow-hidden">
            <Image
              src={service.images.main}
              alt={`${service.title} main image`}
              fill
              sizes="(max-width: 1024px) 100vw, 557px"
              className="object-cover"
              priority
            />
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 lg:gap-[18px] w-full lg:w-[557px]">
            {service.images.gallery.map((image, index) => (
              <div
                key={image}
                className="relative aspect-square rounded-[6px] overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
              >
                <Image
                  src={image}
                  alt={`${service.title} gallery image ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 25vw, 97px"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 w-full lg:w-[557px]">
            <h2 className="font-sans font-medium text-[22px] text-black mb-6">
              Ratings & Reviews
            </h2>

            <div className="bg-gray-50 rounded-2xl p-6 mb-6 flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-semibold text-black">
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
              <button className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-100 transition">
                Write a review
              </button>
            </div>

            <div className="space-y-4">
              {service.reviews.items
                .slice(0, visibleCount)
                .map((review, idx) => (
                  <div
                    key={`${review.name}-${idx}`}
                    className="border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition"
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
                className="w-full mt-4 py-3 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition"
              >
                Load more reviews
              </button>
            )}
          </div>
        </section>

        <section className="w-full lg:w-[673px] flex flex-col gap-[51px]">
          <header className="flex flex-col gap-[21px] max-w-[513px]">
            <h1 className="font-sans font-medium text-[44px] leading-12 tracking-[-2%] text-black">
              {service.title}
            </h1>
            <div className="w-fit flex items-center px-[18px] py-3 gap-2.5 border border-[#848484] rounded-[100px]">
              <span className="font-sans font-medium text-[22px] leading-7 tracking-[-2%] text-black">
                {service.priceText}
              </span>
            </div>
          </header>

          <div className="flex flex-col gap-8">
            <article className="flex flex-col gap-[21px]">
              <h2 className="font-sans font-medium text-[22px] leading-7 tracking-[-2%] text-black uppercase">
                Description
              </h2>
              <p className="font-sans font-normal text-[22px] leading-7 tracking-[-2%] text-[#878787]">
                {service.description}
              </p>
            </article>

            <article className="flex flex-col gap-[21px]">
              <h2 className="font-sans font-medium text-[22px] leading-7 tracking-[-2%] text-black uppercase">
                Includes
              </h2>
              <ul className="list-disc list-inside font-sans font-normal text-[22px] leading-7 tracking-[-2%] text-[#878787]">
                {service.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="flex flex-col gap-[21px]">
              <h2 className="font-sans font-medium text-[22px] leading-7 tracking-[-2%] text-black uppercase">
                How to Book
              </h2>
              <ol className="list-decimal list-inside font-sans font-normal text-[22px] leading-7 tracking-[-2%] text-[#878787]">
                {service.howToBook.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          </div>

          <button className="w-[148px] h-14 flex items-center justify-center bg-[#388082] rounded-[12px] hover:opacity-90 transition-all active:scale-95">
            <span className="font-['Helvetica_Neue'] font-medium text-[22px] leading-[110%] tracking-[-2%] text-white">
              Book now
            </span>
          </button>
        </section>
      </div>
    </main>
  );
}
