import { notFound } from "next/navigation";
import { fetchServiceDetailFromContentful } from "@/lib/contentful-management";
import ServiceDetailClient from "./service-detail-client";

type ServiceDetail = {
  title: string;
  breadcrumbLabel: string;
  priceText: string;
  description: string;
  includes: string[];
  howToBook: string[];
  images: {
    main: string;
    gallery: string[];
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    items: Array<{
      name: string;
      rating: number;
      date: string;
      comment: string;
    }>;
  };
};

const sharedReviews = {
  averageRating: 4.8,
  totalReviews: 27,
  items: [
    {
      name: "Sarah J.",
      rating: 5,
      date: "2 weeks ago",
      comment:
        "Chef Amber menyulap makan malam kami jadi luar biasa! Presentasi cantik dan rasanya premium.",
    },
    {
      name: "Michael T.",
      rating: 5,
      date: "1 month ago",
      comment:
        "Professional service dari awal sampai akhir. Highly recommended untuk acara spesial.",
    },
    {
      name: "Dina K.",
      rating: 4,
      date: "2 months ago",
      comment:
        "Menu sangat personal dan sesuai request kami. Pengalaman dining yang intimate.",
    },
  ],
};

const services: Record<string, ServiceDetail> = {
  private: {
    title: "Private Service",
    breadcrumbLabel: "Private Service",
    priceText: "Starting at: $XXX per person / $XXX per event",
    description:
      "Enjoy a fully personalized dining experience cooked on-site by Chef Amber. Every menu is crafted around your preferences, dietary needs, and the mood of your occasion — using fresh, sustainable, and high-quality ingredients. Perfect for intimate dinners, family meals, or special celebrations at home.",
    includes: [
      "Custom menu consultation",
      "Groceries & ingredient sourcing",
      "On-site cooking & full meal preparation",
      "Professional plating & table presentation",
      "Kitchen cleanup after service",
      "Optional add-ons: dessert course, mocktails, kids' menu",
    ],
    howToBook: [
      "Fill out the booking form or send an inquiry through our contact page.",
      "Share your preferred date, guest count, and any dietary notes.",
      "Receive a customized menu proposal & quote.",
      "Confirm your booking with a deposit.",
      "Relax — Chef Amber handles the rest.",
    ],
    images: {
      main: "/services/private-service/main-img-private.png",
      gallery: [
        "/services/private-service/img-1.png",
        "/services/private-service/img-2.png",
        "/services/private-service/img-3.png",
        "/services/private-service/img-4.png",
        "/services/private-service/img-5.png",
      ],
    },
    reviews: sharedReviews,
  },
  catering: {
    title: "Catering",
    breadcrumbLabel: "Catering",
    priceText: "Starting at: $XXX per person / $XXX per event",
    description:
      "Professional catering for events of all sizes. We provide fresh, flavorful dishes and seamless service for parties, corporate gatherings, and special occasions.",
    includes: [
      "Menu planning consultation",
      "Ingredient sourcing and prep",
      "On-site setup and buffet styling",
      "Serving staff options",
      "Cleanup after service",
      "Custom add-ons for dietary needs",
    ],
    howToBook: [
      "Send your event date, guest count, and location details.",
      "Choose a menu package or request custom options.",
      "Review the proposal and confirm the quote.",
      "Secure the date with a deposit.",
      "Enjoy effortless catering on the day of your event.",
    ],
    images: {
      main: "/services/img-1.png",
      gallery: [
        "/services/img-1.png",
        "/services/img-2.png",
        "/services/img-3.png",
      ],
    },
    reviews: sharedReviews,
  },
  "cooking-class": {
    title: "Cooking Class",
    breadcrumbLabel: "Cooking Class",
    priceText: "Starting at: $XXX per person",
    description:
      "Learn practical cooking skills in a fun and interactive session. Perfect for beginners and food lovers who want to cook confidently at home.",
    includes: [
      "Class prep and ingredient kits",
      "Step-by-step live instruction",
      "Hands-on practice and tastings",
      "Recipe cards to take home",
      "Cleanup and kitchen reset",
      "Optional private group sessions",
    ],
    howToBook: [
      "Select your preferred class date and group size.",
      "Share skill level and dietary preferences.",
      "Receive the class outline and pricing.",
      "Confirm the booking with a deposit.",
      "Show up ready to cook and have fun.",
    ],
    images: {
      main: "/services/img-2.png",
      gallery: [
        "/services/img-1.png",
        "/services/img-2.png",
        "/services/img-3.png",
      ],
    },
    reviews: sharedReviews,
  },
};

const toServiceDetail = (entry: {
  title: string;
  breadcrumbLabel: string;
  priceText: string;
  description: string;
  includes: string[];
  howToBook: string[];
  mainImagePath: string;
  imagePath: string;
  galleryImagePaths: string[];
  reviews: {
    averageRating: number;
    totalReviews: number;
    items: Array<{
      name: string;
      rating: number;
      date: string;
      comment: string;
    }>;
  } | null;
}): ServiceDetail => ({
  title: entry.title,
  breadcrumbLabel: entry.breadcrumbLabel || entry.title,
  priceText: entry.priceText,
  description: entry.description,
  includes: entry.includes,
  howToBook: entry.howToBook,
  images: {
    main: entry.mainImagePath || entry.imagePath,
    gallery: entry.galleryImagePaths.length
      ? entry.galleryImagePaths
      : [entry.imagePath].filter(Boolean),
  },
  reviews: entry.reviews ?? sharedReviews,
});

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contentfulService = await fetchServiceDetailFromContentful(slug);
  const service = contentfulService
    ? toServiceDetail(contentfulService)
    : services[slug];

  if (!service) {
    notFound();
  }

  return <ServiceDetailClient service={service} />;
}
