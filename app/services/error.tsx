"use client";

import { Button } from "@/components/ui/button";

export default function ServicesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col w-full">
      <section className="bg-white py-[50px] px-6 md:px-[62px]">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="text-[40px] md:text-[56px] font-semibold text-[#1C1C1C]">
            We hit a snag loading services
          </h2>
          <p className="mt-4 text-[18px] md:text-[20px] text-[#6B6B6B]">
            Please refresh or try again in a moment.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              className="bg-[#00676E] hover:bg-[#00575e]"
              onClick={reset}
            >
              Try again
            </Button>
          </div>
          {error?.message && (
            <p className="mt-6 text-xs text-[#9A9A9A]">{error.message}</p>
          )}
        </div>
      </section>
    </div>
  );
}
