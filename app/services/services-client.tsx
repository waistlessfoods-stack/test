"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

type Service = {
  slug: string;
  title: string;
  description: string;
  benefits: string[];
  image: string | null;
};

const servicesIntroParagraphs = [
  "Redefine the way you experience dining with elevated culinary services that bring artfully prepared cuisine and chef-driven experiences directly to you. Whether you're looking to refine your culinary techniques through our cooking classes, enjoy a stress-free gathering with professional catering, or create an intimate private chef dining experience, we offer something for every occasion. We create spaces where beautifully composed food, connection, and celebration are shared with the ones who matter most.",
  "Though we proudly serve the Houston area and surrounding communities, we are also available for travel across the United States for private chef services and catering.",
];

export default function ServicesClientPage({
  services,
}: {
  services: Service[];
}) {
  return (
    <div className="flex flex-col w-full">
      <section className="bg-white py-8 px-6 md:px-12">
        <div className="max-w-328.75 mx-auto">
          <div className="mx-auto mb-8 flex max-w-5xl flex-col items-center gap-5 text-center">
            <h2 className="font-['Bebas_Neue'] text-[60px] font-normal leading-tight uppercase text-black align-bottom">
              Our Services
            </h2>

            <div className="flex flex-col gap-4 text-base leading-7 text-[#424242] md:text-lg md:leading-8">
              {servicesIntroParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-3 lg:gap-5">
            {services.map((service) => (
              <div
                key={service.slug}
                className="flex flex-col justify-between gap-5 bg-[#F4F4F4] p-5 md:p-6"
              >
                <div className="flex flex-1 flex-col gap-5">
                  <div className="flex flex-col gap-3">
                    <h3 className="font-sans text-[28px] font-semibold leading-tight text-black md:text-[34px]">
                      {service.title}
                    </h3>
                    <p className="font-sans text-[15px] font-medium leading-7 text-[#222222] md:text-base">
                      {service.description}
                    </p>
                  </div>

                  {service.benefits.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {service.benefits.map((benefit, idx) => (
                        <li
                          key={idx}
                          className="flex gap-2.5 font-sans text-[13px] font-medium leading-6 text-[#5F5F5F] md:text-sm"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00676E]" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <Button
                    asChild
                    className="mt-auto h-11 w-full rounded-none border border-[#00676E] bg-white font-sans text-[14px] font-bold uppercase tracking-wide text-[#00676E] transition-all hover:bg-[#00676E] hover:text-white active:scale-[0.97]"
                  >
                    <Link href={`/services/${service.slug}`}>Learn More</Link>
                  </Button>
                </div>

                <div className="relative h-44 w-full overflow-hidden md:h-52">
                  {service.image && (
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-110"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
