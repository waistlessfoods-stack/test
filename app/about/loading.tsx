import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/container";

export default function AboutLoading() {
  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden font-metropolis">
      {/* Hero Section Skeleton */}
      <section className="w-full py-12 lg:py-8 2xl:py-8">
        <Container>
          <div className="relative w-full aspect-16/5 min-h-[400px] lg:min-h-[280px] 2xl:min-h-[300px] bg-gray-200 rounded-[16px] lg:rounded-[16px] 2xl:rounded-[16px] flex items-center justify-center">
            <div className="space-y-4 px-8 md:px-20">
              <Skeleton className="h-12 lg:h-10 w-96 max-w-full" />
              <Skeleton className="h-6 lg:h-5 w-[500px] max-w-full" />
            </div>
          </div>
        </Container>
      </section>

      {/* About Content Skeleton */}
      <section className="bg-white py-20 lg:py-12 2xl:py-14">
        <Container className="flex flex-col items-center">
          <Skeleton className="h-16 lg:h-12 w-80 mb-10 lg:mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 w-full">
            {/* Left side - Image */}
            <div className="flex flex-col gap-8 lg:gap-5">
              <Skeleton className="aspect-square w-full rounded-[16px] lg:rounded-[16px]" />
            </div>

            {/* Right side - Content */}
            <div className="flex flex-col gap-8 lg:gap-5">
              <div className="space-y-4">
                <Skeleton className="h-10 lg:h-8 w-64" />
                <Skeleton className="h-5 lg:h-4 w-full" />
                <Skeleton className="h-5 lg:h-4 w-full" />
                <Skeleton className="h-5 lg:h-4 w-4/5" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-10 lg:h-8 w-64" />
                <Skeleton className="h-5 lg:h-4 w-full" />
                <Skeleton className="h-5 lg:h-4 w-full" />
                <Skeleton className="h-5 lg:h-4 w-3/4" />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Skills/Values Section Skeleton */}
      <section className="bg-[#F4F4F4] py-20 lg:py-12 2xl:py-14">
        <Container>
          <Skeleton className="h-16 lg:h-12 w-96 mx-auto mb-12 lg:mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-md space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Gallery Section Skeleton */}
      <section className="bg-white py-20 lg:py-12 2xl:py-14">
        <Container>
          <Skeleton className="h-16 lg:h-12 w-64 mx-auto mb-12 lg:mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-md lg:rounded-lg" />
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
