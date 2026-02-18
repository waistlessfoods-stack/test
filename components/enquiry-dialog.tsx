"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EnquiryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  enquiryType: "private_chef" | "cooking_class" | "blog";
  title: string;
  description: string;
}

export default function EnquiryDialog({
  isOpen,
  onOpenChange,
  enquiryType,
  title,
  description,
}: EnquiryDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: enquiryType,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit enquiry");
      }

      setSubmitStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });

      setTimeout(() => {
        onOpenChange(false);
        setSubmitStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Error submitting enquiry:", error);
      setSubmitStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white border-[#d7e3e2]">
        <DialogHeader>
          <DialogTitle className="text-[#0e2f31]">{title}</DialogTitle>
          <DialogDescription className="text-[#5b6b69]">
            {description}
          </DialogDescription>
        </DialogHeader>

        {submitStatus === "success" ? (
          <div className="py-8 text-center">
            <p className="text-lg font-semibold text-[#0f6f73] mb-2">
              ✓ Thank you!
            </p>
            <p className="text-sm text-[#5b6b69]">
              We've received your enquiry and will be in touch soon.
            </p>
          </div>
        ) : submitStatus === "error" ? (
          <div className="py-8 text-center">
            <p className="text-lg font-semibold text-red-600 mb-2">
              ✗ Something went wrong
            </p>
            <p className="text-sm text-[#5b6b69] mb-4">
              Please try again or email us directly.
            </p>
            <Button
              onClick={() => setSubmitStatus("idle")}
              className="bg-[#0f6f73] text-white hover:bg-[#0d5a5d]"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[#0e2f31] mb-1"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-[#d7e3e2] rounded-lg text-[#0e2f31] placeholder-[#8b9493] focus:outline-none focus:ring-2 focus:ring-[#0f6f73]/50"
                placeholder="Your name"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#0e2f31] mb-1"
              >
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-[#d7e3e2] rounded-lg text-[#0e2f31] placeholder-[#8b9493] focus:outline-none focus:ring-2 focus:ring-[#0f6f73]/50"
                placeholder="your@email.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-[#0e2f31] mb-1"
              >
                Phone (optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[#d7e3e2] rounded-lg text-[#0e2f31] placeholder-[#8b9493] focus:outline-none focus:ring-2 focus:ring-[#0f6f73]/50"
                placeholder="(281) 436-9245"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-[#0e2f31] mb-1"
              >
                Message (optional)
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-[#d7e3e2] rounded-lg text-[#0e2f31] placeholder-[#8b9493] focus:outline-none focus:ring-2 focus:ring-[#0f6f73]/50 resize-none"
                placeholder="Tell us more about your inquiry..."
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-[#0f6f73] border border-[#0f6f73] rounded-lg hover:bg-[#f6f4f0] disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#0f6f73] rounded-lg hover:bg-[#0d5a5d] disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Enquiry"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
