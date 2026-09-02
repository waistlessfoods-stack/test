import { currentUser } from "@clerk/nextjs/server";
import { or, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

type ClerkEmailAddress = {
  id?: string | null;
  email_address?: string | null;
  verification?: { status?: string | null } | null;
};

type ClerkUserRecord = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_addresses?: ClerkEmailAddress[] | null;
  primary_email_address_id?: string | null;
  image_url?: string | null;
  created_at?: number | null;
  updated_at?: number | null;
};

export type ClerkUserSyncResult =
  | {
      skipped: true;
      reason:
        | "missing-email"
        | "missing-user"
        | "unverified-email-conflict";
    }
  | { skipped: false; userId: string };

function getPrimaryEmailRecord(data: ClerkUserRecord): ClerkEmailAddress | null {
  const emails = data.email_addresses ?? [];

  if (data.primary_email_address_id) {
    const primary = emails.find(
      (email) => email.id === data.primary_email_address_id
    );
    if (primary?.email_address) {
      return primary;
    }
  }

  return emails.find((email) => Boolean(email.email_address)) ?? null;
}

function buildName(data: ClerkUserRecord): string {
  const parts = [data.first_name, data.last_name]
    .map((value) => value?.trim())
    .filter(Boolean);

  return parts.join(" ") || "Unknown";
}

function toDate(value: number | null | undefined, fallback: Date): Date {
  return typeof value === "number" ? new Date(value) : fallback;
}

export async function upsertClerkUser(
  data: ClerkUserRecord
): Promise<ClerkUserSyncResult> {
  const primaryEmail = getPrimaryEmailRecord(data);
  const email = primaryEmail?.email_address?.trim().toLowerCase();

  if (!email) {
    return { skipped: true as const, reason: "missing-email" as const };
  }

  const now = new Date();
  const emailVerified = primaryEmail?.verification?.status === "verified";
  const profile = {
    name: buildName(data),
    email,
    emailVerified,
    image: data.image_url ?? null,
    updatedAt: toDate(data.updated_at, now),
  };

  const existingUsers = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(or(eq(user.id, data.id), eq(user.email, email)));
  const existingByEmail = existingUsers.find(
    (existingUser) => existingUser.email.toLowerCase() === email
  );
  const existingByClerkId = existingUsers.find(
    (existingUser) => existingUser.id === data.id
  );

  // Accounts created before the Clerk migration already own a row with this
  // email. Keep that stable internal ID instead of violating user_email_unique.
  // Only a verified Clerk email is allowed to claim the legacy identity.
  if (existingByEmail && existingByEmail.id !== data.id && !emailVerified) {
    return {
      skipped: true as const,
      reason: "unverified-email-conflict" as const,
    };
  }

  const existingUser = existingByEmail ?? existingByClerkId;

  if (existingUser) {
    await db.update(user).set(profile).where(eq(user.id, existingUser.id));

    return {
      skipped: false as const,
      userId: existingUser.id,
    };
  }

  const [createdUser] = await db
    .insert(user)
    .values({
      id: data.id,
      ...profile,
      createdAt: toDate(data.created_at, now),
    })
    .onConflictDoUpdate({
      target: user.email,
      set: profile,
    })
    .returning({ userId: user.id });

  return {
    skipped: false as const,
    userId: createdUser.userId,
  };
}

export function getClerkUserIdentityIds(
  clerkUserId: string,
  syncResult: ClerkUserSyncResult
): string[] {
  if (syncResult.skipped) {
    return [clerkUserId];
  }

  return [...new Set([clerkUserId, syncResult.userId])];
}

export async function syncCurrentClerkUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return { skipped: true as const, reason: "missing-user" as const };
  }

  return upsertClerkUser({
    id: clerkUser.id,
    first_name: clerkUser.firstName,
    last_name: clerkUser.lastName,
    email_addresses: clerkUser.emailAddresses.map((email) => ({
      id: email.id,
      email_address: email.emailAddress,
      verification: {
        status: email.verification?.status,
      },
    })),
    primary_email_address_id: clerkUser.primaryEmailAddressId,
    image_url: clerkUser.imageUrl,
    created_at: clerkUser.createdAt,
    updated_at: clerkUser.updatedAt,
  });
}
