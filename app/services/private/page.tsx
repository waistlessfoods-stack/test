"use client";

import Image from "next/image";
import React, { useState } from "react";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Sarah J.",
    rating: 5,
    date: "2 weeks ago",
    comment:
      "Chef Amber menyulap makan malam kami jadi luar biasa! Presentasi cantik dan rasanya premium.",
  },
  {
    name: "Michael T.",
    rating: 5,
    date: "1 month ago",
    comment:
      "Professional service dari awal sampai akhir. Highly recommended untuk acara spesial.",
  },
  {
    name: "Dina K.",
    rating: 4,
    date: "2 months ago",
    comment:
      "Menu sangat personal dan sesuai request kami. Pengalaman dining yang intimate.",
  },
];

export default function PrivateServicePage() {
  const [visibleCount, setVisibleCount] = useState(2);
  const averageRating = 4.8;
  const totalReviews = 27;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 md:py-16 bg-white min-h-screen">
      <nav className="flex items-center gap-4 w-full max-w-[315px] h-7 mb-[53px]">
        <span className="font-sans font-medium text-[22px] leading-7 tracking-[-2%] text-black">
          Our Service
        </span>
        <span className="font-sans font-medium text-[22px] leading-7 tracking-[-2%] text-black">
          /
        </span>
        <span className="font-sans font-medium text-[22px] leading-7 tracking-[-2%] text-black">
          Private Service
        </span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-[53px] items-start">
        <section className="w-full lg:w-[557px] flex flex-col gap-[25px]">
          <div className="relative w-full lg:w-[557px] aspect-557/642 rounded-[12px] overflow-hidden">
            <Image
              src="/services/private-service/main-img-private.png"
              alt="Main service"
              fill
              sizes="(max-width: 1024px) 100vw, 557px"
              className="object-cover"
              priority
            />
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 lg:gap-[18px] w-full lg:w-[557px]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="relative aspect-square rounded-[6px] overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
              >
                <Image
                  src={`/services/private-service/img-${i}.png`}
                  alt={`Gallery image ${i}`}
                  fill
                  sizes="(max-width: 768px) 25vw, 97px"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>

          {/* Ratings & Reviews */}
          <div className="mt-10 pt-8 border-t border-gray-100 w-full lg:w-[557px]">
            <h2 className="font-sans font-medium text-[22px] text-black mb-6">
              Ratings & Reviews
            </h2>

            {/* Summary */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-6 flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-semibold text-black">
                    {averageRating}
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Based on {totalReviews} reviews
                </p>
              </div>
              <button className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-100 transition">
                Write a review
              </button>
            </div>

            {/* Review List */}
            <div className="space-y-4">
              {reviews.slice(0, visibleCount).map((review, idx) => (
                <div
                  key={idx}
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

            {visibleCount < reviews.length && (
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
              Private Service
            </h1>
            <div className="w-fit flex items-center px-[18px] py-3 gap-2.5 border border-[#848484] rounded-[100px]">
              <span className="font-sans font-medium text-[22px] leading-7 tracking-[-2%] text-black">
                Starting at: $XXX per person / $XXX per event
              </span>
            </div>
          </header>

          <div className="flex flex-col gap-8">
            <article className="flex flex-col gap-[21px]">
              <h2 className="font-sans font-medium text-[22px] leading-7 tracking-[-2%] text-black uppercase">
                Description
              </h2>
              <p className="font-sans font-normal text-[22px] leading-7 tracking-[-2%] text-[#878787]">
                Enjoy a fully personalized dining experience cooked on-site by
                Chef Amber. Every menu is crafted around your preferences,
                dietary needs, and the mood of your occasion — using fresh,
                sustainable, and high-quality ingredients. Perfect for intimate
                dinners, family meals, or special celebrations at home.
              </p>
            </article>

            <article className="flex flex-col gap-[21px]">
              <h2 className="font-sans font-medium text-[22px] leading-7 tracking-[-2%] text-black uppercase">
                Includes
              </h2>
              <ul className="list-disc list-inside font-sans font-normal text-[22px] leading-7 tracking-[-2%] text-[#878787]">
                <li>Custom menu consultation</li>
                <li>Groceries & ingredient sourcing</li>
                <li>On-site cooking & full meal preparation</li>
                <li>Professional plating & table presentation</li>
                <li>Kitchen cleanup after service</li>
                <li>Optional add-ons: dessert course, mocktails, kids’ menu</li>
              </ul>
            </article>

            <article className="flex flex-col gap-[21px]">
              <h2 className="font-sans font-medium text-[22px] leading-7 tracking-[-2%] text-black uppercase">
                How to Book
              </h2>
              <ol className="list-decimal list-inside font-sans font-normal text-[22px] leading-7 tracking-[-2%] text-[#878787]">
                <li>
                  Fill out the booking form or send an inquiry through our
                  contact page.
                </li>
                <li>
                  Share your preferred date, guest count, and any dietary notes.
                </li>
                <li>Receive a customized menu proposal & quote.</li>
                <li>Confirm your booking with a deposit.</li>
                <li>Relax — Chef Amber handles the rest.</li>
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
