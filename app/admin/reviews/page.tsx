"use client";

import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth";

type ReviewStatus = "pending" | "approved" | "rejected";

type ModeratedReview = {
  id: number;
  serviceSlug: string;
  serviceTitle: string;
  name: string;
  email: string | null;
  rating: number | null;
  reviewText: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  moderatedAt: string | null;
  source: string;
};

const FILTERS: Array<{ value: "all" | ReviewStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<ReviewStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ModeratedReview[]>([]);
  const [filter, setFilter] = useState<"all" | ReviewStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const { authenticated, logout } = useAdminAuth();

  useEffect(() => {
    if (!authenticated) return;

    let cancelled = false;
    async function loadReviews() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin/reviews", { method: "POST" });
        const data = (await response.json()) as {
          reviews?: ModeratedReview[];
          error?: string;
        };

        if (cancelled) return;
        if (response.status === 401) {
          logout();
          return;
        }
        if (!response.ok) {
          setError(data.error ?? "Failed to load reviews.");
          return;
        }
        setReviews(data.reviews ?? []);
      } catch {
        if (!cancelled) setError("Failed to connect. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReviews();
    return () => {
      cancelled = true;
    };
  }, [authenticated, logout]);

  const counts = useMemo(
    () => ({
      all: reviews.length,
      pending: reviews.filter((review) => review.status === "pending").length,
      approved: reviews.filter((review) => review.status === "approved").length,
      rejected: reviews.filter((review) => review.status === "rejected").length,
    }),
    [reviews]
  );

  const filteredReviews =
    filter === "all"
      ? reviews
      : reviews.filter((review) => review.status === filter);

  async function updateStatus(reviewId: number, status: ReviewStatus) {
    setUpdatingId(reviewId);
    setError("");
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, status }),
      });
      const data = (await response.json()) as {
        review?: ModeratedReview;
        error?: string;
      };

      if (response.status === 401) {
        logout();
        return;
      }
      if (!response.ok || !data.review) {
        setError(data.error ?? "Failed to update review.");
        return;
      }

      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId ? data.review! : review
        )
      );
    } catch {
      setError("Failed to update review. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteReview(review: ModeratedReview) {
    if (
      !window.confirm(
        `Permanently delete ${review.name}'s review? This cannot be undone.`
      )
    ) {
      return;
    }

    setUpdatingId(review.id);
    setError("");
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id }),
      });
      const data = (await response.json()) as {
        deleted?: boolean;
        error?: string;
      };

      if (response.status === 401) {
        logout();
        return;
      }
      if (!response.ok || !data.deleted) {
        setError(data.error ?? "Failed to delete review.");
        return;
      }

      setReviews((current) =>
        current.filter((item) => item.id !== review.id)
      );
    } catch {
      setError("Failed to delete review. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f5f5]">
      <header className="bg-[#388082] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div>
            <Link
              href="/admin"
              className="text-xs font-medium text-white/70 hover:text-white"
            >
              ← Admin Portal
            </Link>
            <h1 className="mt-1 text-xl font-semibold">Review Moderation</h1>
            <p className="mt-1 text-sm text-white/70">
              Only approved reviews appear on service pages.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/20"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === item.value
                  ? "bg-[#388082] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.label} ({counts[item.value]})
            </button>
          ))}
        </div>

        {error ? (
          <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            Loading reviews...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="font-semibold text-gray-900">No {filter === "all" ? "" : filter} reviews</h2>
            <p className="mt-1 text-sm text-gray-500">
              New submissions will appear here for moderation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-gray-900">{review.name}</h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_STYLES[review.status]}`}
                      >
                        {review.status}
                      </span>
                      {review.source === "contentful-import" ||
                      review.source === "client-supplied" ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {review.source === "client-supplied"
                            ? "Client-supplied review"
                            : "Imported existing review"}
                        </span>
                      ) : null}
                    </div>
                    {review.email ? (
                      <a
                        href={`mailto:${review.email}`}
                        className="mt-1 block text-sm text-[#388082] hover:underline"
                      >
                        {review.email}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">
                        Imported existing review — no email collected
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {review.serviceTitle} · Submitted {formatDate(review.createdAt)}
                    </p>
                  </div>
                  {review.rating !== null ? (
                    <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-5 w-5 ${
                            index < review.rating!
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Rating not supplied</span>
                  )}
                </div>

                <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                  {review.reviewText}
                </p>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    disabled={updatingId === review.id || review.status === "approved"}
                    onClick={() => updateStatus(review.id, "approved")}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === review.id || review.status === "rejected"}
                    onClick={() => updateStatus(review.id, "rejected")}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Reject
                  </button>
                  {review.status !== "pending" ? (
                    <button
                      type="button"
                      disabled={updatingId === review.id}
                      onClick={() => updateStatus(review.id, "pending")}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                      Return to pending
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={updatingId === review.id}
                    onClick={() => deleteReview(review)}
                    className="ml-auto inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete permanently
                  </button>
                  {updatingId === review.id ? (
                    <span className="self-center text-xs text-gray-400">Updating...</span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
