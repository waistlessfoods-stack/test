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
import { HONEYPOT_FIELD } from "@/lib/honeypot";

const MIN_BOOKING_GUESTS = 1;
const MAX_BOOKING_GUESTS = 50;

type BookingPageClientProps = {
  serviceSlug: string;
  serviceTitle: string;
  howToBook: string[];
  bookingImagePath: string | null;
};

export default function BookingPageClient({
  serviceSlug,
  serviceTitle,
  howToBook,
  bookingImagePath,
}: BookingPageClientProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [preferredDate, setPreferredDate] = useState<Date>();
  const [alternativeDate, setAlternativeDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleIncrement = () =>
    setGuests((prev) => Math.min(prev + 1, MAX_BOOKING_GUESTS));
  const handleDecrement = () =>
    setGuests((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !email || !phone || !guests || !preferredDate || !notes) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!Number.isInteger(guests) || guests < MIN_BOOKING_GUESTS || guests > MAX_BOOKING_GUESTS) {
      setError(
        `Number of guests must be a whole number between ${MIN_BOOKING_GUESTS} and ${MAX_BOOKING_GUESTS}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug,
          serviceTitle,
          firstName,
          lastName,
          email,
          phone,
          guests,
          preferredDate: format(preferredDate, "PPP"),
          alternativeDate: alternativeDate ? format(alternativeDate, "PPP") : null,
          notes,
          [HONEYPOT_FIELD]: companyWebsite,
        }),
      });

      const data: { error?: string; confirmationEmailSent?: boolean } =
        await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setConfirmationEmailSent(data.confirmationEmailSent !== false);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-start bg-white p-5 md:p-8 gap-8 lg:gap-12 xl:gap-14 max-w-[1320px] mx-auto font-['Metropolis']">
      {/* LEFT SIDE */}
      <aside className="lg:basis-4/12 w-full bg-[#F4F4F4] rounded-lg p-6 md:p-7 py-8 flex flex-col justify-between items-center relative overflow-hidden lg:sticky lg:top-6 lg:self-start">
        <div className="w-full max-w-[422px]">
          <h2 className="text-xl md:text-2xl font-medium leading-tight tracking-tight mb-5 md:mb-6 text-black">
            How to Book
          </h2>
          <div className="flex flex-col gap-5 md:gap-6 relative">
            {howToBook.map((step, index) => (
              <div
                key={`${index + 1}-${step}`}
                className="flex gap-3 items-start relative z-10"
              >
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#388082] flex items-center justify-center text-white text-base md:text-lg font-semibold">
                    {index + 1}
                  </div>
                  {index !== howToBook.length - 1 && (
                    <div className="w-[2px] h-8 md:h-9 border-l-2 border-dashed border-[#388082] mt-2" />
                  )}
                </div>
                <p className="text-base md:text-lg font-normal leading-snug tracking-tight pt-1 text-[#878787]">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 md:mt-10 w-full flex justify-center relative px-4">
          {bookingImagePath && (
            <Image
              src={bookingImagePath}
              alt="Cooking illustration"
              width={582}
              height={927}
              className="object-contain w-full h-auto max-w-[280px] md:max-w-[320px] lg:max-w-none translate-y-3"
              priority
            />
          )}
        </div>
      </aside>

      {/* RIGHT SIDE */}
      <main className="flex-1 w-full py-4 md:py-6 max-w-[760px] mx-auto lg:mx-0">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-medium leading-tight tracking-tight mb-3 text-black">
            Book {serviceTitle}
          </h1>
          <p className="text-base md:text-lg font-normal leading-relaxed tracking-tight text-[#878787]">
            Fill in your details and we'll contact you to confirm availability.
          </p>
        </header>

        {submitted ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 md:p-12 shadow-sm text-center">
            <div className="w-14 h-14 rounded-full bg-[#388082] flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-medium text-black mb-3">Request Received!</h2>
            <p className="text-[#878787] text-base md:text-lg">
              {confirmationEmailSent ? (
                <>
                  Thank you, {firstName}. We've received your booking request and sent a confirmation to <strong>{email}</strong>. We'll be in touch shortly.
                </>
              ) : (
                <>
                  Thank you, {firstName}. We've received your booking request, but the confirmation email could not be sent. We'll still be in touch shortly.
                </>
              )}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-2 gap-7 md:gap-8 rounded-xl border border-gray-100 bg-white p-5 md:p-8 shadow-sm"
          >
            <input
              type="text"
              name={HONEYPOT_FIELD}
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <div className="lg:col-span-2 pb-2">
              <h2 className="text-sm md:text-base font-semibold uppercase tracking-wide text-[#388082]">
                Contact Details
              </h2>
            </div>

            <div className="flex flex-col gap-3 md:gap-3.5">
              <Label className="text-base md:text-lg font-medium tracking-tight text-black">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-12 md:h-14 bg-[#F4F4F4] border-none rounded-lg px-4 text-base md:text-lg placeholder:text-[#878787] focus-visible:ring-1 focus-visible:ring-[#388082]"
                placeholder="e.g. Sarah"
              />
            </div>

            <div className="flex flex-col gap-3 md:gap-3.5">
              <Label className="text-base md:text-lg font-medium tracking-tight text-black">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-12 md:h-14 bg-[#F4F4F4] border-none rounded-lg px-4 text-base md:text-lg placeholder:text-[#878787] focus-visible:ring-1 focus-visible:ring-[#388082]"
                placeholder="e.g. Anderson"
              />
            </div>

            <div className="flex flex-col gap-3 md:gap-3.5">
              <Label className="text-base md:text-lg font-medium tracking-tight text-black">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 md:h-14 bg-[#F4F4F4] border-none rounded-lg px-4 text-base md:text-lg placeholder:text-[#878787] focus-visible:ring-1 focus-visible:ring-[#388082]"
                placeholder="e.g. sarah@email.com"
              />
            </div>

            <div className="flex flex-col gap-3 md:gap-3.5">
              <Label className="text-base md:text-lg font-medium tracking-tight text-black">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 md:h-14 bg-[#F4F4F4] border-none rounded-lg px-4 text-base md:text-lg placeholder:text-[#878787] focus-visible:ring-1 focus-visible:ring-[#388082]"
                placeholder="e.g. (555) 123-4567"
              />
            </div>

            <div className="flex flex-col gap-3 md:gap-3.5">
              <Label className="text-base md:text-lg font-medium tracking-tight text-black">
                Expected Number of Guests <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={guests}
                  min={MIN_BOOKING_GUESTS}
                  max={MAX_BOOKING_GUESTS}
                  step={1}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setGuests(0);
                      return;
                    }

                    const nextGuests = Number(value);
                    setGuests(Number.isFinite(nextGuests) ? nextGuests : 0);
                  }}
                  className="h-12 md:h-14 bg-[#F4F4F4] border-none rounded-lg px-4 text-base md:text-lg focus-visible:ring-1 focus-visible:ring-[#388082] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="1"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-20">
                  <ChevronUp
                    onClick={handleIncrement}
                    className="w-5 h-5 cursor-pointer text-gray-400 hover:text-black transition-colors"
                  />
                  <ChevronDown
                    onClick={handleDecrement}
                    className="w-5 h-5 cursor-pointer text-gray-400 hover:text-black transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 border-t border-gray-100 pt-3">
              <h2 className="text-sm md:text-base font-semibold uppercase tracking-wide text-[#388082]">
                Event Details
              </h2>
            </div>

            {/* Preferred Date */}
            <div className="flex flex-col gap-3 md:gap-3.5">
              <Label className="text-base md:text-lg font-medium tracking-tight text-black">
                Preferred Event Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative cursor-pointer">
                    <Input
                      className={cn(
                        "h-12 md:h-14 bg-[#F4F4F4] border-none rounded-lg px-4 text-base md:text-lg cursor-pointer focus-visible:ring-1 focus-visible:ring-[#388082]",
                        !preferredDate && "text-[#878787]"
                      )}
                      value={
                        preferredDate
                          ? format(preferredDate, "PPP")
                          : "Select a date"
                      }
                      readOnly
                    />
                    <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-[#00676E]" />
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

            <div className="flex flex-col gap-3 md:gap-3.5">
              <Label className="text-base md:text-lg font-medium tracking-tight text-black">
                Alternative Event Date{" "}
                <span className="text-[#878787] font-normal text-sm md:text-base ml-1">
                  (optional)
                </span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative cursor-pointer">
                    <Input
                      className={cn(
                        "h-12 md:h-14 bg-[#F4F4F4] border-none rounded-lg px-4 text-base md:text-lg cursor-pointer focus-visible:ring-1 focus-visible:ring-[#388082]",
                        !alternativeDate && "text-[#878787]"
                      )}
                      value={
                        alternativeDate
                          ? format(alternativeDate, "PPP")
                          : "Select a date"
                      }
                      readOnly
                    />
                    <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-[#00676E]" />
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

            <div className="flex flex-col gap-3 md:gap-3.5 lg:col-span-2">
              <Label className="text-base md:text-lg font-medium tracking-tight text-black">
                Additional Notes <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[130px] md:min-h-[165px] bg-[#F4F4F4] border-none rounded-lg p-4 md:p-5 text-base md:text-lg placeholder:text-[#878787] focus-visible:ring-1 focus-visible:ring-[#388082] resize-none"
                placeholder="Add notes here"
              />
            </div>

            {error && (
              <div className="lg:col-span-2 text-red-500 text-sm md:text-base">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 md:mt-4 w-full h-12 md:h-14 lg:col-span-2 lg:w-[240px] lg:justify-self-end bg-[#388082] hover:bg-[#2d6668] disabled:opacity-60 disabled:cursor-not-allowed text-white text-base md:text-lg font-medium rounded-lg transition-all duration-200 active:scale-[0.98]"
            >
              {isSubmitting ? "Submitting..." : "Confirm Booking"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
