"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: 1,
    text: "Fill out the booking form or send an inquiry through our contact page.",
  },
  {
    id: 2,
    text: "Share your preferred date, guest count, and any dietary notes.",
  },
  { id: 3, text: "Receive a customized menu proposal & quote." },
  { id: 4, text: "Confirm your booking with a deposit." },
  { id: 5, text: "Relax — Chef Amber handles the rest." },
];

export default function BookingPage() {
  const [guests, setGuests] = useState<number>(0);

  const [preferredDate, setPreferredDate] = useState<Date>();
  const [alternativeDate, setAlternativeDate] = useState<Date>();

  const handleIncrement = () => setGuests((prev) => prev + 1);
  const handleDecrement = () => setGuests((prev) => (prev > 0 ? prev - 1 : 0));

  return (
    <div className="flex flex-col lg:flex-row items-stretch min-h-screen bg-white p-4 md:p-10 gap-10 lg:gap-16 max-w-[1440px] mx-auto font-['Metropolis']">
      {/* LEFT SIDE */}
      <aside className="lg:basis-4/12 w-full bg-[#F4F4F4] rounded-[12px] p-6 md:p-8 py-10 flex flex-col justify-between items-center relative overflow-hidden">
        <div className="w-full max-w-[422px]">
          <h2 className="text-[24px] md:text-[26px] font-medium leading-[28px] tracking-[-2%] mb-8 md:mb-10 text-black">
            How to Book
          </h2>
          <div className="flex flex-col gap-6 md:gap-[26px] relative">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex gap-4 items-start relative z-10"
              >
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#388082] flex items-center justify-center text-white text-lg md:text-[22px] font-semibold">
                    {step.id}
                  </div>
                  {index !== steps.length - 1 && (
                    <div className="w-[2px] h-10 md:h-[48px] border-l-2 border-dashed border-[#388082] mt-2" />
                  )}
                </div>
                <p className="text-lg md:text-[22px] font-normal leading-tight tracking-[-2%] pt-1 text-[#878787]">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-auto w-full flex justify-center relative px-4">
          <Image
            src="/services/private-service/book/cooking.png"
            alt="Cooking illustration"
            width={582}
            height={927}
            className="object-contain w-full h-auto max-w-[350px] lg:max-w-none translate-y-8"
            priority
          />
        </div>
      </aside>

      {/* RIGHT SIDE */}
      <main className="flex-1 w-full py-10 max-w-[739px] mx-auto lg:mx-0">
        <header className="mb-10 md:mb-[53px]">
          <h1 className="text-3xl md:text-[44px] font-medium leading-tight md:leading-[48px] tracking-[-2%] mb-4 text-black">
            Book Private Service
          </h1>
          <p className="text-lg md:text-[22px] font-normal leading-snug md:leading-[28px] tracking-[-2%] text-[#878787]">
            Fill in your details and we’ll contact you to confirm availability.
          </p>
        </header>

        <form className="flex flex-col gap-8 md:gap-[43px]">
          {[
            { label: "First Name", placeholder: "e.g. Sarah Anderson" },
            { label: "Last Name", placeholder: "e.g. Sarah Anderson" },
            { label: "Email Address", placeholder: "e.g. sarah@email.com" },
            { label: "Phone Number", placeholder: "e.g. (555) 123-4567" },
          ].map((field) => (
            <div key={field.label} className="flex flex-col gap-4 md:gap-5">
              <Label className="text-lg md:text-[22px] font-medium tracking-[-2%] text-black">
                {field.label} <span className="text-red-500">*</span>
              </Label>
              <Input
                className="h-16 md:h-[80px] bg-[#F4F4F4] border-none rounded-[12px] px-5 text-lg md:text-[22px] placeholder:text-[#878787] focus-visible:ring-1 focus-visible:ring-[#388082]"
                placeholder={field.placeholder}
              />
            </div>
          ))}

          <div className="flex flex-col gap-4 md:gap-5">
            <Label className="text-lg md:text-[22px] font-medium tracking-[-2%] text-black">
              Expected Number of Guests <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 0)}
                className="h-16 md:h-[80px] bg-[#F4F4F4] border-none rounded-[12px] px-5 text-lg md:text-[22px] focus-visible:ring-1 focus-visible:ring-[#388082] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-20">
                <ChevronUp
                  onClick={handleIncrement}
                  className="w-5 h-5 md:w-6 md:h-6 cursor-pointer text-gray-400 hover:text-black transition-colors"
                />
                <ChevronDown
                  onClick={handleDecrement}
                  className="w-5 h-5 md:w-6 md:h-6 cursor-pointer text-gray-400 hover:text-black transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8 md:gap-[43px]">
            {/* Preferred Date */}
            <div className="flex flex-col gap-4 md:gap-5">
              <Label className="text-lg md:text-[22px] font-medium tracking-[-2%] text-black">
                Preferred Event Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative cursor-pointer">
                    <Input
                      className={cn(
                        "h-16 md:h-[80px] bg-[#F4F4F4] border-none rounded-[12px] px-5 text-lg md:text-[22px] cursor-pointer focus-visible:ring-1 focus-visible:ring-[#388082]",
                        !preferredDate && "text-[#878787]",
                      )}
                      value={
                        preferredDate
                          ? format(preferredDate, "PPP")
                          : "Select a date"
                      }
                      readOnly
                    />
                    <CalendarIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 text-[#00676E]" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={preferredDate}
                    onSelect={setPreferredDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-4 md:gap-5">
              <Label className="text-lg md:text-[22px] font-medium tracking-[-2%] text-black">
                Alternative Event Date{" "}
                <span className="text-[#878787] font-normal text-base md:text-lg ml-1">
                  (optional)
                </span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative cursor-pointer">
                    <Input
                      className={cn(
                        "h-16 md:h-[80px] bg-[#F4F4F4] border-none rounded-[12px] px-5 text-lg md:text-[22px] cursor-pointer focus-visible:ring-1 focus-visible:ring-[#388082]",
                        !alternativeDate && "text-[#878787]",
                      )}
                      value={
                        alternativeDate
                          ? format(alternativeDate, "PPP")
                          : "Select a date"
                      }
                      readOnly
                    />
                    <CalendarIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 text-[#00676E]" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={alternativeDate}
                    onSelect={setAlternativeDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:gap-5">
            <Label className="text-lg md:text-[22px] font-medium tracking-[-2%] text-black">
              Additional Notes <span className="text-red-500">*</span>
            </Label>
            <Textarea
              className="min-h-[150px] md:min-h-[200px] bg-[#F4F4F4] border-none rounded-[12px] p-5 md:p-6 text-lg md:text-[22px] placeholder:text-[#878787] focus-visible:ring-1 focus-visible:ring-[#388082] resize-none"
              placeholder="Add notes here"
            />
          </div>

          <button
            type="submit"
            className="mt-4 md:mt-6 w-full h-16 md:h-[80px] bg-[#388082] hover:bg-[#2d6668] text-white text-xl md:text-[24px] font-medium rounded-[12px] transition-all duration-200 active:scale-[0.98]"
          >
            Confirm Booking
          </button>
        </form>
      </main>
    </div>
  );
}
