import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/container";

export default function ShopLoading() {
  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden font-metropolis">
      {/* Banner Skeleton */}
      <section className="w-full py-12 lg:py-8 2xl:py-8">
        <Container>
          <div className="relative w-full aspect-16/5 min-h-[400px] lg:min-h-[280px] 2xl:min-h-[300px] bg-gray-200 rounded-[16px] lg:rounded-[16px] 2xl:rounded-[16px] flex items-center justify-center">
            <div className="px-8 md:px-20 space-y-4">
              <Skeleton className="h-12 lg:h-10 w-96 max-w-full" />
              <Skeleton className="h-6 lg:h-5 w-[500px] max-w-full" />
            </div>
          </div>
        </Container>
      </section>

      {/* Shop Section Skeleton */}
      <section className="bg-[#F4F4F4] py-20 lg:py-12 2xl:py-14">
        <Container className="flex flex-col items-center">
          <Skeleton className="h-16 lg:h-12 w-80 mb-10 lg:mb-6" />

          {/* Search bar */}
          <div className="relative w-full mb-12 lg:mb-8">
            <Skeleton className="w-full h-20 lg:h-14 rounded-lg" />
          </div>

          {/* Categories carousel */}
          <div className="w-full mb-20 lg:mb-12 px-4">
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-[140px] md:h-[160px] lg:h-[115px] min-w-[150px] flex-shrink-0 rounded-lg lg:rounded-md"
                />
              ))}
            </div>
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-10 lg:gap-x-5 gap-y-16 lg:gap-y-10 w-full">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-8 lg:gap-5">
                <div className="relative">
                  <Skeleton className="aspect-square w-full rounded-[16px] lg:rounded-[16px]" />
                  {/* Price tag skeleton */}
                  <div className="absolute top-0 right-0 w-36 lg:w-24 h-36 lg:h-24">
                    <Skeleton className="w-full h-full" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }} />
                  </div>
                </div>
                <div className="px-4 lg:px-2 space-y-3 lg:space-y-2">
                  <Skeleton className="h-8 lg:h-6 w-3/4" />
                  <Skeleton className="h-5 lg:h-4 w-full" />
                  <Skeleton className="h-5 lg:h-4 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
