import { fetchServicesFromContentful } from "@/lib/contentful-management";
import { buildMetadata } from "@/lib/seo";
import ServicesClientPage from "./services-client";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Services",
  description:
    "Explore private chef services, catering, and cooking classes from WaistLess Foods.",
  path: "/services",
});

const fallbackSlugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const toServiceSlug = (title: string) => {
  const normalized = title.toLowerCase();

  if (normalized.includes("private")) {
    return "private";
  }

  if (normalized.includes("catering")) {
    return "catering";
  }

  if (normalized.includes("cooking class")) {
    return "cooking-class";
  }

  return fallbackSlugify(title);
};

export default async function ServicesPage() {
  const servicesFromContentful = await fetchServicesFromContentful();

  const services = servicesFromContentful.map((service) => ({
    slug: service.slug?.trim() ? service.slug : toServiceSlug(service.title),
    title: service.title,
    description: service.description,
    benefits: service.benefits,
    image: service.imagePath,
  }));

  return <ServicesClientPage services={services} />;
}
