import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";
import { serviceReviews } from "@/lib/db/schema";

const VALID_STATUSES = ["pending", "approved", "rejected"] as const;

export async function POST(request: NextRequest) {
  try {
    const authError = requireAdminSession(request);
    if (authError) return authError;

    const reviews = await db
      .select()
      .from(serviceReviews)
      .orderBy(desc(serviceReviews.createdAt));

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews for moderation:", error);
    return NextResponse.json(
      { error: "Failed to load reviews." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authError = requireAdminSession(request);
    if (authError) return authError;

    const body = (await request.json()) as Record<string, unknown>;
    const reviewId = Number(body.reviewId);
    const status = String(body.status ?? "");

    if (
      !Number.isInteger(reviewId) ||
      reviewId < 1 ||
      !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid review ID or moderation status." },
        { status: 400 }
      );
    }

    const existingReview = await db
      .select({
        id: serviceReviews.id,
        serviceSlug: serviceReviews.serviceSlug,
      })
      .from(serviceReviews)
      .where(eq(serviceReviews.id, reviewId))
      .limit(1);

    if (!existingReview.length) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const now = new Date();
    const [updatedReview] = await db
      .update(serviceReviews)
      .set({
        status,
        updatedAt: now,
        moderatedAt: status === "pending" ? null : now,
      })
      .where(
        and(
          eq(serviceReviews.id, reviewId),
          eq(serviceReviews.serviceSlug, existingReview[0].serviceSlug)
        )
      )
      .returning();

    revalidatePath(`/services/${updatedReview.serviceSlug}`);

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    console.error("Error moderating review:", error);
    return NextResponse.json(
      { error: "Failed to update review." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authError = requireAdminSession(request);
    if (authError) return authError;

    const body = (await request.json()) as Record<string, unknown>;
    const reviewId = Number(body.reviewId);

    if (!Number.isInteger(reviewId) || reviewId < 1) {
      return NextResponse.json({ error: "Invalid review ID." }, { status: 400 });
    }

    const [deletedReview] = await db
      .delete(serviceReviews)
      .where(eq(serviceReviews.id, reviewId))
      .returning({
        id: serviceReviews.id,
        serviceSlug: serviceReviews.serviceSlug,
      });

    if (!deletedReview) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    revalidatePath(`/services/${deletedReview.serviceSlug}`);

    return NextResponse.json({ deleted: true, reviewId: deletedReview.id });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review." },
      { status: 500 }
    );
  }
}
