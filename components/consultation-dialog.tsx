"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HONEYPOT_FIELD } from "@/lib/honeypot";

type ConsultationDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  schedulingUrl?: string;
};

type SubmitResult = {
  error?: string;
  confirmationEmailSent?: boolean;
};

function isSafeSchedulingUrl(value?: string): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function ConsultationDialog({
  isOpen,
  onOpenChange,
  schedulingUrl,
}: ConsultationDialogProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    guests: "",
    preferredDate: "",
    alternativeDate: "",
    budgetRange: "",
    eventDetails: "",
    companyWebsite: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(true);
  const [error, setError] = useState("");
  const safeSchedulingUrl = useMemo(
    () => (isSafeSchedulingUrl(schedulingUrl) ? schedulingUrl : undefined),
    [schedulingUrl]
  );
  const canSchedule = Boolean(safeSchedulingUrl);

  useEffect(() => {
    if (!submitted || !safeSchedulingUrl) return;

    const redirectTimer = window.setTimeout(() => {
      window.location.assign(safeSchedulingUrl);
    }, 1600);

    return () => window.clearTimeout(redirectTimer);
  }, [canSchedule, safeSchedulingUrl, submitted]);

  const updateField = (name: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const guests = Number(formData.guests);
    if (!Number.isInteger(guests) || guests < 1 || guests > 50) {
      setError("Expected guests must be a whole number between 1 and 50.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug: "complimentary-consultation",
          serviceTitle: "Complimentary Consultation",
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          guests,
          preferredDate: formData.preferredDate,
          alternativeDate: formData.alternativeDate || null,
          notes: `Budget range: ${formData.budgetRange}\n\nEvent details:\n${formData.eventDetails}`,
          [HONEYPOT_FIELD]: formData.companyWebsite,
        }),
      });
      const result = (await response.json()) as SubmitResult;

      if (!response.ok) {
        throw new Error(result.error || "Unable to send your consultation request.");
      }

      setConfirmationEmailSent(result.confirmationEmailSent !== false);
      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send your consultation request."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#d7e3e2] bg-white sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="text-[#0e2f31]">
            Book a Complimentary Consultation
          </DialogTitle>
          <DialogDescription className="leading-6 text-[#5b6b69]">
            Share a few event details first. We&apos;ll save your request, then
            take you to Chef Amber&apos;s calendar to choose a consultation time.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0f6f73] text-xl text-white">
              ✓
            </div>
            <h3 className="mb-2 text-xl font-semibold text-[#0e2f31]">
              Consultation request received
            </h3>
            <p className="mx-auto max-w-lg text-sm leading-6 text-[#5b6b69]">
              {confirmationEmailSent
                ? "A copy has been sent to your email."
                : "Your request was saved, although the confirmation email could not be sent."}{" "}
              {canSchedule
                ? "Opening the consultation calendar now…"
                : "Chef Amber will contact you with scheduling details."}
            </p>
            {canSchedule && (
              <a
                href={safeSchedulingUrl}
                className="mt-5 inline-flex rounded-lg bg-[#0f6f73] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0d5a5d]"
              >
                Continue to scheduling
              </a>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              name={HONEYPOT_FIELD}
              value={formData.companyWebsite}
              onChange={(event) =>
                updateField("companyWebsite", event.target.value)
              }
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {[
              ["firstName", "First name", "e.g. Sarah"],
              ["lastName", "Last name", "e.g. Anderson"],
            ].map(([name, label, placeholder]) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={`consultation-${name}`}>{label} *</Label>
                <Input
                  id={`consultation-${name}`}
                  value={formData[name as "firstName" | "lastName"]}
                  onChange={(event) =>
                    updateField(
                      name as "firstName" | "lastName",
                      event.target.value
                    )
                  }
                  placeholder={placeholder}
                  required
                  disabled={isSubmitting}
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <Label htmlFor="consultation-email">Email *</Label>
              <Input
                id="consultation-email"
                type="email"
                value={formData.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="consultation-phone">Phone *</Label>
              <Input
                id="consultation-phone"
                type="tel"
                value={formData.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="(555) 123-4567"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="consultation-guests">Expected guests *</Label>
              <Input
                id="consultation-guests"
                type="number"
                min={1}
                max={50}
                step={1}
                value={formData.guests}
                onChange={(event) => updateField("guests", event.target.value)}
                placeholder="10"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="consultation-budget">Budget range *</Label>
              <Input
                id="consultation-budget"
                value={formData.budgetRange}
                onChange={(event) =>
                  updateField("budgetRange", event.target.value)
                }
                placeholder="Please provide your estimated range"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="consultation-preferred-date">
                Preferred event date *
              </Label>
              <Input
                id="consultation-preferred-date"
                type="date"
                value={formData.preferredDate}
                onChange={(event) =>
                  updateField("preferredDate", event.target.value)
                }
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="consultation-alternative-date">
                Alternative date
              </Label>
              <Input
                id="consultation-alternative-date"
                type="date"
                value={formData.alternativeDate}
                onChange={(event) =>
                  updateField("alternativeDate", event.target.value)
                }
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="consultation-details">Event details *</Label>
              <Textarea
                id="consultation-details"
                value={formData.eventDetails}
                onChange={(event) =>
                  updateField("eventDetails", event.target.value)
                }
                placeholder="Tell us about the occasion, location, service you are considering, and anything else that would help us prepare."
                className="min-h-28 resize-none"
                required
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
            )}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-[#0f6f73] px-5 py-2.5 text-sm font-medium text-[#0f6f73] hover:bg-[#f6f4f0]"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0f6f73] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0d5a5d] disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending…" : "Send request and schedule"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
