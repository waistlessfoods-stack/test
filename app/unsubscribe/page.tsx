import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Newsletter Preferences | WaistLess Foods",
  description: "Manage your subscription to The WaistLess Table.",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{
    subscriber?: string;
    token?: string;
    status?: string;
  }>;
}) {
  const { subscriber = "", token = "", status = "" } = await searchParams;
  const canConfirm = /^\d+$/.test(subscriber) && /^[a-f0-9]{64}$/i.test(token);

  return (
    <main className="bg-[#f3efe8] px-4 py-20 sm:py-28">
      <section className="mx-auto max-w-xl rounded-2xl border border-[#e5ded3] bg-white px-6 py-10 text-center shadow-sm sm:px-12">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00676e]">
          The WaistLess Table
        </p>
        <h1 className="mt-4 font-serif text-3xl text-gray-950">
          Newsletter preferences
        </h1>

        {status === "success" ? (
          <p className="mt-6 leading-7 text-gray-600">
            You have been unsubscribed and will no longer receive The WaistLess
            Table emails. You can subscribe again from the website at any time.
          </p>
        ) : status === "invalid" || !canConfirm ? (
          <p className="mt-6 leading-7 text-gray-600">
            This unsubscribe link is invalid. Please use the link from your most
            recent WaistLess Foods email.
          </p>
        ) : status === "error" ? (
          <p className="mt-6 leading-7 text-red-700">
            We could not update your subscription. Please try the link again.
          </p>
        ) : (
          <>
            <p className="mt-6 leading-7 text-gray-600">
              Confirm that you no longer want to receive recipes, culinary
              inspiration, and updates from The WaistLess Table.
            </p>
            <form
              action="/api/newsletter/unsubscribe"
              method="post"
              className="mt-8"
            >
              <input type="hidden" name="subscriber" value={subscriber} />
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="rounded-lg bg-[#00676e] px-6 py-3 font-semibold text-white hover:bg-[#00545a]"
              >
                Unsubscribe me
              </button>
            </form>
          </>
        )}

        <Link
          href="/"
          className="mt-8 inline-block text-sm font-semibold text-[#00676e] underline underline-offset-4"
        >
          Return to WaistLess Foods
        </Link>
      </section>
    </main>
  );
}
