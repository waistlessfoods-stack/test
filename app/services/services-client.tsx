"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

type Service = {
  title: string;
  description: string;
  benefits: string[];
  image: string;
};

export default function ServicesClientPage({
  services,
}: {
  services: Service[];
}) {
  return (
    <div className="flex flex-col w-full">
      <section className="bg-white py-[50px] px-6 md:px-[62px]">
        <div className="max-w-[1315px] mx-auto">
          <h2 className="font-['Bebas_Neue'] text-[80px] font-normal leading-[85.37px] tracking-[0.01em] uppercase text-black text-center mb-[60px] align-bottom">
            Our Service
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-10 lg:gap-5">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-[#F4F4F4] rounded-[12px] p-5 md:p-10 lg:p-[41px_20px] flex flex-col justify-between min-h-[874px] gap-9"
              >
                <div className="flex flex-col gap-9">
                  <div className="flex flex-col gap-[30px]">
                    <h3 className="font-[family-name:var(--sans font-semibold text-[32px] md:text-[44px] leading-tight md:leading-12 tracking-[-0.02em] text-black">
                      {service.title}
                    </h3>
                    <p className="font-[family-name:var(--sans font-medium text-[18px] md:text-[22px] leading-relaxed md:leading-7 tracking-[-0.02em] text-black">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-9">
                    <span className="font-[family-name:var(--sans font-bold text-[20px] md:text-[22px] leading-7 tracking-[-0.02em] text-[#6E6E6E]">
                      Benefits:
                    </span>
                    <ul className="list-disc pl-5 flex flex-col gap-2">
                      {service.benefits.map((benefit, idx) => (
                        <li
                          key={idx}
                          className="font-[family-name:var(--sans font-medium text-[18px] md:text-[20px] leading-relaxed tracking-[-0.02em] text-[#6E6E6E]"
                        >
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button className="w-full h-[52px] border border-[#00676E] bg-white rounded-[6px] font-sans font-bold text-[18px] uppercase tracking-wide text-[#00676E] transition-all hover:bg-[#00676E] hover:text-white active:scale-[0.97]">
                    Learn More
                  </Button>
                </div>

                <div className="relative w-full h-[289px] overflow-hidden rounded-[12px]">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-110"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
