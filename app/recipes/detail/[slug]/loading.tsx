import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/container";

export default function RecipeDetailLoading() {
  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden font-metropolis">
      <section className="w-full py-16 2xl:py-12">
        <Container>
          {/* Breadcrumb Skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-4" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-14 2xl:gap-8">
            {/* Left Side - Image Skeleton */}
            <div className="w-full lg:w-1/2 flex items-center">
              <Skeleton className="w-full aspect-square lg:aspect-auto lg:h-[642px] rounded-lg 2xl:rounded-lg" />
            </div>

            {/* Right Side - Details Skeleton */}
            <div className="w-full lg:w-1/2 flex flex-col gap-12 2xl:gap-8 justify-start">
              {/* Title */}
              <Skeleton className="h-12 2xl:h-10 w-full max-w-md" />

              {/* Description Section */}
              <div className="flex flex-col gap-5 2xl:gap-4">
                <Skeleton className="h-8 2xl:h-7 w-40" />
                <div className="space-y-3">
                  <Skeleton className="h-6 2xl:h-5 w-full" />
                  <Skeleton className="h-6 2xl:h-5 w-full" />
                  <Skeleton className="h-6 2xl:h-5 w-4/5" />
                </div>
              </div>

              {/* Price Box Skeleton */}
              <div className="bg-[#F7F7F7] rounded-lg 2xl:rounded-lg p-5 2xl:p-4">
                <div className="flex flex-col gap-5 2xl:gap-4">
                  {/* Price Row */}
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-10 2xl:h-9 w-24" />
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 2xl:gap-2 w-full">
                    <Skeleton className="flex-1 h-14 2xl:h-12 rounded-lg 2xl:rounded-md" />
                    <Skeleton className="flex-1 h-14 2xl:h-12 rounded-lg 2xl:rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
