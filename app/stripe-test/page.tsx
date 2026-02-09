"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function StripeTestPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSuccess = searchParams.get("success") === "1";
  const isCanceled = searchParams.get("canceled") === "1";

  const startCheckout = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error || "Checkout failed.");
      }

      const payload = await response.json();
      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }

      throw new Error("No checkout URL returned.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Checkout failed.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-6 py-16 text-[#1C1C1C]">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-[#E3DDD3] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
        <h1 className="text-3xl font-semibold tracking-tight">
          Stripe Checkout Test
        </h1>
        <p className="mt-3 text-base text-[#6F6A63]">
          Launch a simple hosted Checkout Session to verify Stripe is wired up.
        </p>

        {isSuccess && (
          <div className="mt-6 rounded-xl border border-[#CDE7D6] bg-[#EFFAF3] px-4 py-3 text-sm text-[#1B5E3C]">
            Payment succeeded. You can run another test.
          </div>
        )}

        {isCanceled && (
          <div className="mt-6 rounded-xl border border-[#F4D0C6] bg-[#FFF5F2] px-4 py-3 text-sm text-[#8B3E2B]">
            Checkout was canceled. Try again when ready.
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-[#F4D0C6] bg-[#FFF5F2] px-4 py-3 text-sm text-[#8B3E2B]">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={startCheckout}
          disabled={isLoading}
          className="mt-8 w-full rounded-xl bg-[#1B5E3C] px-5 py-3 text-base font-semibold text-white shadow-md transition hover:bg-[#174E33] disabled:cursor-not-allowed disabled:bg-[#A7B4A9]"
        >
          {isLoading ? "Redirecting..." : "Start Checkout"}
        </button>

        <p className="mt-6 text-xs text-[#8C857A]">
          Uses Stripe test mode keys from your local .env file.
        </p>
      </div>
    </main>
  );
}
