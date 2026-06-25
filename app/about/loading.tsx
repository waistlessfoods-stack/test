import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/container";

export default function AboutLoading() {
  return (
    <div className="w-full min-h-screen bg-[#FBFAF7] overflow-x-hidden font-metropolis">
      <section className="w-full py-16 md:py-24">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:gap-16">
            <div className="flex max-w-3xl flex-col gap-7">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-24 w-80 max-w-full md:h-32 md:w-96" />
              <div className="space-y-4">
                <Skeleton className="h-5 w-full max-w-2xl" />
                <Skeleton className="h-5 w-11/12 max-w-2xl" />
                <Skeleton className="h-5 w-10/12 max-w-2xl" />
                <Skeleton className="h-5 w-full max-w-2xl" />
                <Skeleton className="h-5 w-9/12 max-w-2xl" />
              </div>
            </div>

            <div className="mx-auto w-full max-w-[420px] lg:mx-0 lg:justify-self-end">
              <Skeleton className="aspect-[4/5] w-full rounded-md" />
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-[#F4F4F4] py-16 md:py-24">
        <Container>
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(280px,460px)_minmax(0,1fr)] lg:gap-16">
            <div className="mx-auto w-full max-w-[460px] lg:mx-0">
              <Skeleton className="aspect-[4/5] w-full rounded-md" />
            </div>

            <div className="flex flex-col gap-8">
              <div className="space-y-4">
                <Skeleton className="h-16 w-72 max-w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-11/12" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-10/12" />
              </div>

              <div className="space-y-5 border-t border-[#D7D4CF] pt-8">
                <Skeleton className="h-7 w-80 max-w-full" />
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="h-5 w-72 max-w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
