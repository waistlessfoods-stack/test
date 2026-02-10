import { Skeleton } from "@/components/ui/skeleton";

export default function ServicesLoading() {
  return (
    <div className="flex flex-col w-full">
      <section className="bg-white py-[50px] px-6 md:px-[62px]">
        <div className="max-w-[1315px] mx-auto">
          <Skeleton className="mx-auto mb-[60px] h-10 w-56" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-10 lg:gap-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-[#F4F4F4] rounded-[12px] p-5 md:p-10 lg:p-[41px_20px] flex flex-col justify-between min-h-[874px] gap-9"
              >
                <div className="flex flex-col gap-9">
                  <div className="flex flex-col gap-[30px]">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                  </div>

                  <div className="flex flex-col gap-4">
                    <Skeleton className="h-6 w-28" />
                    <div className="flex flex-col gap-2">
                      {Array.from({ length: 4 }).map((_, itemIndex) => (
                        <Skeleton key={itemIndex} className="h-4 w-full" />
                      ))}
                    </div>
                  </div>

                  <Skeleton className="h-[52px] w-full" />
                </div>

                <Skeleton className="h-[289px] w-full rounded-[12px]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
