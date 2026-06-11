"use client";

import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const carouselArrowButtonVariants = cva(
  "absolute top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-none backdrop-blur-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        subtle:
          "border-black/5 bg-white/45 text-black/30 hover:border-black/10 hover:bg-white/70 hover:text-black/55",
        brand:
          "border-[#00676E]/25 bg-[#00676E] text-white shadow-[0_4px_14px_rgba(0,103,110,0.28)] hover:border-[#00575e]/40 hover:bg-[#00575e] hover:text-white",
      },
      side: {
        previous: "left-1",
        next: "right-1",
      },
    },
    defaultVariants: {
      tone: "subtle",
      side: "previous",
    },
  },
);

function CarouselArrowButton({
  className,
  tone,
  side,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof carouselArrowButtonVariants>) {
  return (
    <button
      type="button"
      className={cn(carouselArrowButtonVariants({ tone, side }), className)}
      {...props}
    />
  );
}

export { CarouselArrowButton, carouselArrowButtonVariants };
