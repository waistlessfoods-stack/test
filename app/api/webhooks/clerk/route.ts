import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { upsertClerkUser } from "@/lib/clerk-user-sync";
import { eq } from "drizzle-orm";

type ClerkEmailAddress = {
  email_address: string;
  verification?: { status: string } | null;
};

type ClerkUserPayload = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string;
  image_url: string | null;
  created_at: number;
  updated_at: number;
};

type ClerkDeletedPayload = {
  id: string;
};

type WebhookEvent =
  | { type: "user.created"; data: ClerkUserPayload }
  | { type: "user.updated"; data: ClerkUserPayload }
  | { type: "user.deleted"; data: ClerkDeletedPayload };

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Clerk Webhook] CLERK_WEBHOOK_SECRET is not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();

  let event: WebhookEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("[Clerk Webhook] Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log(`[Clerk Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "user.created": {
        const data = event.data;
        const result = await upsertClerkUser(data);
        if (result.skipped) {
          console.warn(`[Clerk Webhook] user.created ${data.id}: no email, skipping`);
          break;
        }
        console.log(`[Clerk Webhook] user.created: upserted user ${data.id}`);
        break;
      }

      case "user.updated": {
        const data = event.data;
        const result = await upsertClerkUser(data);
        if (result.skipped) {
          console.warn(`[Clerk Webhook] user.updated ${data.id}: no email, skipping`);
          break;
        }
        console.log(`[Clerk Webhook] user.updated: upserted user ${data.id}`);
        break;
      }

      case "user.deleted": {
        const { id } = event.data;
        if (!id) break;
        await db.delete(user).where(eq(user.id, id));
        console.log(`[Clerk Webhook] user.deleted: deleted user ${id}`);
        break;
      }

      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${(event as any).type}`);
    }
  } catch (err) {
    console.error(`[Clerk Webhook] DB error handling ${event.type}:`, err);
    return new Response("Internal server error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
