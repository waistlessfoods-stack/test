"use client";

import * as React from "react";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import Fade from "embla-carousel-fade";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  fade?: boolean;
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  fade = false,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const carouselPlugins = React.useMemo<CarouselPlugin>(() => {
    if (!fade) {
      return plugins;
    }

    return [...(plugins ?? []), Fade()];
  }, [fade, plugins]);

  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    carouselPlugins,
  );
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return;
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  React.useEffect(() => {
    if (!api || !setApi) return;
    setApi(api);
  }, [api, setApi]);

  React.useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);

    return () => {
      api?.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation:
          orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div
      ref={carouselRef}
      className="overflow-hidden"
      data-slot="carousel-content"
    >
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel();

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
      {...props}
    />
  );
}

type CarouselControlProps = React.ComponentProps<typeof Button> & {
  appearance?: "glass" | "brand";
};

function CarouselPrevious({
  className,
  appearance = "glass",
  variant = "ghost",
  size = "icon",
  ...props
}: CarouselControlProps) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();
  const isBrand = appearance === "brand";

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        isBrand
          ? "absolute size-12 rounded-full border border-black/5 bg-[#00676E]/45 p-0 text-white shadow-none backdrop-blur-sm transition-all hover:border-black/10 hover:bg-[#00676E]/70 hover:text-white"
          : "group absolute size-12 overflow-hidden rounded-full border border-white/45 bg-[#16B0B9]/72 p-0 shadow-[inset_0_2px_1px_rgba(255,255,255,0.42),inset_0_-8px_14px_rgba(0,89,98,0.18),0_8px_18px_rgba(0,47,52,0.24)] backdrop-blur-md transition-all before:absolute before:inset-[3px] before:rounded-full before:border before:border-white/20 before:content-[''] hover:bg-[#16B0B9]/82 hover:shadow-[inset_0_2px_1px_rgba(255,255,255,0.5),inset_0_-8px_14px_rgba(0,89,98,0.16),0_10px_22px_rgba(0,47,52,0.28)]",
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeft
        className={cn(
          "relative z-10 text-white transition-colors",
          isBrand
            ? "size-7"
            : "size-7 drop-shadow-[0_1px_1px_rgba(0,77,86,0.55)]",
        )}
      />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

function CarouselNext({
  className,
  appearance = "glass",
  variant = "ghost",
  size = "icon",
  ...props
}: CarouselControlProps) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  const isBrand = appearance === "brand";

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        isBrand
          ? "absolute size-12 rounded-full border border-black/5 bg-[#00676E]/45 p-0 text-white shadow-none backdrop-blur-sm transition-all hover:border-black/10 hover:bg-[#00676E]/70 hover:text-white"
          : "group absolute size-12 overflow-hidden rounded-full border border-white/45 bg-[#16B0B9]/72 p-0 shadow-[inset_0_2px_1px_rgba(255,255,255,0.42),inset_0_-8px_14px_rgba(0,89,98,0.18),0_8px_18px_rgba(0,47,52,0.24)] backdrop-blur-md transition-all before:absolute before:inset-[3px] before:rounded-full before:border before:border-white/20 before:content-[''] hover:bg-[#16B0B9]/82 hover:shadow-[inset_0_2px_1px_rgba(255,255,255,0.5),inset_0_-8px_14px_rgba(0,89,98,0.16),0_10px_22px_rgba(0,47,52,0.28)]",
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRight
        className={cn(
          "relative z-10 text-white transition-colors",
          isBrand
            ? "size-7"
            : "size-7 drop-shadow-[0_1px_1px_rgba(0,77,86,0.55)]",
        )}
      />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
