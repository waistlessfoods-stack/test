import { Suspense } from "react";
import StripeTestContent from "./stripe-test-content";

export default function StripeTestPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StripeTestContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-[#F8F6F2] px-6 py-16 text-[#1C1C1C]">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-[#E3DDD3] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
        <h1 className="text-3xl font-semibold tracking-tight">
          Stripe Checkout Test
        </h1>
        <p className="mt-3 text-base text-[#6F6A63]">
          Loading...
        </p>
      </div>
    </main>
  );
}
