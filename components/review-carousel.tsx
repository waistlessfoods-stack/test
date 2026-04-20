"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Review = {
  name: string;
  rating: number;
  date: string;
  comment: string;
};

type ReviewCarouselProps = {
  reviews: Review[];
  title?: string;
};

export default function ReviewCarousel({
  reviews,
  title = "Slide end review",
}: ReviewCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? reviews.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === reviews.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (!reviews || reviews.length === 0) {
    return null;
  }

  const currentReview = reviews[currentIndex];

  return (
    <div className="w-full bg-white py-12">
      <div className="relative w-full max-w-[1440px] mx-auto px-4">
        {/* Background Image Backdrop */}
        <div className="absolute inset-0 -z-10 opacity-20" />

        {/* Main Carousel Container */}
        <div className="relative flex items-center justify-center">
          {/* Left Arrow Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-14 h-14 flex items-center justify-center bg-[#0F8DAB] hover:bg-[#0D7691] rounded-full transition-colors"
            aria-label="Previous review"
          >
            <ChevronLeft className="w-10 h-10 text-white transform scale-x-[-1]" />
          </button>

          {/* Review Card */}
          <div className="w-full max-w-4xl mx-auto">
            {/* White Container with Border */}
            <div className="bg-white border-4 border-[#16B0B9] rounded-lg p-8 md:p-12 min-h-[300px] flex flex-col justify-between">
              {/* Review Content */}
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
                  {currentReview.name}
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < currentReview.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">{currentReview.date}</span>
                </div>
                <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                  {currentReview.comment}
                </p>
              </div>

              {/* Social Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-[#388082] hover:bg-[#2a6568] text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold transition-colors"
                >
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="text-lg md:text-xl">See more on Facebook</span>
                </a>

                <a
                  href="https://yelp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-[#388082] hover:bg-[#2a6568] text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold transition-colors"
                >
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M10.5 1.5H8.8L3.3 11.5h2.8l1.5-3h5.1l1.5 3h2.8L10.5 1.5zM7.5 7h2l-1-2.5L7.5 7zm12.5 7.5h-2.8l-5.5 10h2.2l1.5-3h5.1l1.5 3h2.8l-5.5-10z" />
                  </svg>
                  <span className="text-lg md:text-xl">See more on Yelp</span>
                </a>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-3 mt-8">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex
                      ? "bg-[#388082]"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-14 h-14 flex items-center justify-center bg-[#0F8DAB] hover:bg-[#0D7691] rounded-full transition-colors"
            aria-label="Next review"
          >
            <ChevronRight className="w-10 h-10 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
