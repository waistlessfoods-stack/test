import { fetchServicesFromContentful } from "@/lib/contentful-management";
import ServicesClientPage from "./services-client";

export default async function ServicesPage() {
  const servicesFromContentful = await fetchServicesFromContentful();

  const services = (servicesFromContentful ?? []).map((service) => ({
    title: service.title,
    description: service.description,
    benefits: service.benefits,
    image: service.imagePath,
  }));

  return <ServicesClientPage services={services} />;
}
