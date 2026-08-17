"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HONEYPOT_FIELD } from "@/lib/honeypot";

type ReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceSlug: string;
  serviceTitle: string;
};

const INITIAL_FORM = {
  name: "",
  email: "",
  rating: 0,
  reviewText: "",
  companyWebsite: "",
};

export default function ReviewDialog({
  open,
  onOpenChange,
  serviceSlug,
  serviceTitle,
}: ReviewDialogProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function updateField(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setForm(INITIAL_FORM);
      setError("");
      setSubmitted(false);
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.rating) {
      setError("Please choose a star rating.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug,
          name: form.name,
          email: form.email,
          rating: form.rating,
          reviewText: form.reviewText,
          [HONEYPOT_FIELD]: form.companyWebsite,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "We could not submit your review.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("We could not submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#d7e3e2] bg-white sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#0e2f31]">
            Review {serviceTitle}
          </DialogTitle>
          <DialogDescription className="leading-6 text-[#5b6b69]">
            Reviews are checked before publication. Your email is used for
            moderation only and is never shown publicly.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center" role="status">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#388082]/10 text-2xl text-[#388082]">
              ✓
            </div>
            <h3 className="text-lg font-semibold text-[#0e2f31]">
              Thank you for your review
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#5b6b69]">
              It has been sent to the WaistLess Foods team for approval.
            </p>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="mt-6 rounded-lg bg-[#388082] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#2e6b6d]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name={HONEYPOT_FIELD}
              value={form.companyWebsite}
              onChange={updateField}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <div>
              <span className="mb-2 block text-sm font-medium text-[#0e2f31]">
                Rating *
              </span>
              <div className="flex gap-1" role="group" aria-label="Rating">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;
                  const selected = value <= form.rating;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({ ...current, rating: value }))
                      }
                      className="rounded p-1 focus:outline-none focus:ring-2 focus:ring-[#388082]"
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                      aria-pressed={form.rating === value}
                    >
                      <Star
                        className={`h-7 w-7 ${
                          selected
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="review-name"
                className="mb-1 block text-sm font-medium text-[#0e2f31]"
              >
                Name *
              </label>
              <input
                id="review-name"
                name="name"
                value={form.name}
                onChange={updateField}
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                disabled={submitting}
                className="w-full rounded-lg border border-[#d7e3e2] px-3 py-2.5 text-[#0e2f31] focus:outline-none focus:ring-2 focus:ring-[#388082]/40"
              />
            </div>

            <div>
              <label
                htmlFor="review-email"
                className="mb-1 block text-sm font-medium text-[#0e2f31]"
              >
                Email *
              </label>
              <input
                id="review-email"
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                required
                maxLength={254}
                autoComplete="email"
                disabled={submitting}
                className="w-full rounded-lg border border-[#d7e3e2] px-3 py-2.5 text-[#0e2f31] focus:outline-none focus:ring-2 focus:ring-[#388082]/40"
              />
            </div>

            <div>
              <label
                htmlFor="review-text"
                className="mb-1 block text-sm font-medium text-[#0e2f31]"
              >
                Review *
              </label>
              <textarea
                id="review-text"
                name="reviewText"
                value={form.reviewText}
                onChange={updateField}
                required
                minLength={20}
                maxLength={2000}
                rows={5}
                disabled={submitting}
                placeholder="Tell us about your experience..."
                className="w-full resize-y rounded-lg border border-[#d7e3e2] px-3 py-2.5 text-[#0e2f31] focus:outline-none focus:ring-2 focus:ring-[#388082]/40"
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {form.reviewText.length}/2000
              </p>
            </div>

            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
                className="rounded-lg border border-[#388082] px-5 py-2.5 text-sm font-medium text-[#388082] hover:bg-[#f0f5f5] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#388082] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2e6b6d] disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit for approval"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
