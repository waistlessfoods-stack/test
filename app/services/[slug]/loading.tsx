import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/container";

export default function ServiceDetailLoading() {
  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden font-metropolis">
      <section className="w-full py-16 2xl:py-12">
        <Container>
          {/* Breadcrumb Skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-4" />
              <Skeleton className="h-6 w-40" />
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8">
            {/* Left Side - Image */}
            <div className="space-y-6">
              <Skeleton className="w-full aspect-[4/3] rounded-md" />
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>

            {/* Right Side - Details */}
            <div className="flex flex-col gap-8">
              {/* Title & Price */}
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-8 w-32" />
              </div>

              {/* Description */}
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
              </div>

              {/* Includes Section */}
              <div className="space-y-4">
                <Skeleton className="h-7 w-40" />
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              </div>

              {/* How to Book */}
              <div className="space-y-4">
                <Skeleton className="h-7 w-40" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-20 space-y-8">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
