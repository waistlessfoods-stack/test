import { currentUser } from "@clerk/nextjs/server";
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

export async function upsertClerkUser(data: ClerkUserRecord) {
  const primaryEmail = getPrimaryEmailRecord(data);
  const email = primaryEmail?.email_address?.trim();

  if (!email) {
    return { skipped: true as const, reason: "missing-email" as const };
  }

  const now = new Date();

  await db
    .insert(user)
    .values({
      id: data.id,
      name: buildName(data),
      email,
      emailVerified: primaryEmail?.verification?.status === "verified",
      image: data.image_url ?? null,
      createdAt: toDate(data.created_at, now),
      updatedAt: toDate(data.updated_at, now),
    })
    .onConflictDoUpdate({
      target: user.id,
      set: {
        name: buildName(data),
        email,
        emailVerified: primaryEmail?.verification?.status === "verified",
        image: data.image_url ?? null,
        updatedAt: toDate(data.updated_at, now),
      },
    });

  return { skipped: false as const };
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
