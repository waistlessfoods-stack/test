import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { serviceReviews } from "@/lib/db/schema";
import { logError } from "@/lib/structured-log";

export type ApprovedServiceReview = {
  id: number;
  name: string;
  rating: number | null;
  date: string;
  comment: string;
};

export async function fetchApprovedServiceReviews(
  serviceSlug: string
): Promise<ApprovedServiceReview[]> {
  try {
    const approvedReviews = await db
      .select({
        id: serviceReviews.id,
        name: serviceReviews.name,
        rating: serviceReviews.rating,
        reviewText: serviceReviews.reviewText,
        createdAt: serviceReviews.createdAt,
      })
      .from(serviceReviews)
      .where(
        and(
          eq(serviceReviews.serviceSlug, serviceSlug),
          eq(serviceReviews.status, "approved")
        )
      )
      .orderBy(desc(serviceReviews.createdAt));

    return approvedReviews.map((review) => ({
      id: review.id,
      name: review.name,
      rating: review.rating,
      date: review.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }),
      comment: review.reviewText,
    }));
  } catch (error) {
    logError("service_reviews.approved_fetch_failed", {
      serviceSlug,
      error,
    });
    return [];
  }
}
