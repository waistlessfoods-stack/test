import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section Skeleton */}
      <section className="relative w-full min-h-[700px] md:h-[707px] flex items-center justify-center bg-gray-200">
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-[1200px] px-6 py-20">
          <div className="flex flex-col items-center gap-8 md:gap-12 max-w-[800px]">
            <div className="flex flex-col items-center gap-4 md:gap-6">
              <Skeleton className="h-24 md:h-32 w-[600px] max-w-full" />
              <Skeleton className="h-8 w-[500px] max-w-full" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Skeleton className="h-14 w-64" />
              <Skeleton className="h-14 w-48" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section Skeleton */}
      <section className="px-6 md:px-28 py-20 bg-white space-y-10 md:space-y-[78px]">
        <div className="text-center space-y-6">
          <Skeleton className="h-12 w-96 mx-auto" />
          <Skeleton className="h-6 w-[600px] max-w-full mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-6">
              <Skeleton className="aspect-square w-full rounded-[16px]" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-12 w-32" />
            </div>
          ))}
        </div>
      </section>

      {/* Featured Recipes Section Skeleton */}
      <section className="bg-[#F4F4F4] py-20">
        <Container>
          <div className="text-center mb-16">
            <Skeleton className="h-16 w-80 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>

          <div className="relative px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="aspect-square w-full rounded-[16px]" />
                  <Skeleton className="h-7 w-3/4" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Testimonials Section Skeleton */}
      <section className="py-20 bg-white">
        <Container>
          <Skeleton className="h-12 w-64 mx-auto mb-16" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-[#F4F4F4] p-8 rounded-md space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-6 w-4/5" />
                <div className="flex items-center gap-4 pt-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
