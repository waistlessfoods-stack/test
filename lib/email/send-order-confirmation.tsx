import React from "react";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { isStoredOrderItems } from "@/lib/order-checkout-snapshot";
import { logError, logInfo, maskEmail } from "@/lib/structured-log";
import OrderConfirmationEmail from "@/lib/email/templates/order-confirmation-email";
import AdminOrderNotificationEmail from "@/lib/email/templates/admin-order-notification-email";
import { fromEmail, sendEmail } from "@/lib/email/mailer";

type SendOrderConfirmationOptions = {
  orderId: number;
  customerName?: string | null;
};

type Audience = "customer" | "admin";
const CLAIM_TIMEOUT_MS = 10 * 60 * 1000;

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

async function sendOrderEmailOnce(
  { orderId, customerName }: SendOrderConfirmationOptions,
  audience: Audience,
): Promise<boolean> {
  // Preserve existing customer markers so delivered receipts stay sent.
  const prefix = audience === "customer" ? "orderConfirmation" : "orderAdminNotification";
  const claimedKey = `${prefix}ClaimedAt`;
  const sentKey = `${prefix}SentAt`;
  const errorKey = `${prefix}Error`;
  const claimedAt = new Date().toISOString();
  const staleBefore = new Date(Date.now() - CLAIM_TIMEOUT_MS).toISOString();
  const [claimedOrder] = await db
    .update(orders)
    .set({
      metadata: sql`(
        coalesce(${orders.metadata}, '{}'::jsonb) - ${errorKey}::text
      ) || jsonb_build_object(${claimedKey}::text, ${claimedAt}::text)`,
    })
    .where(
      and(
        eq(orders.id, orderId),
        eq(orders.status, "completed"),
        sql`${orders.metadata}->>${sentKey}::text is null`,
        sql`(
          ${orders.metadata}->>${claimedKey}::text is null
          or ${orders.metadata}->>${claimedKey}::text < ${staleBefore}::text
        )`,
      ),
    )
    .returning();

  if (!claimedOrder) return false;

  // A stale worker must not erase a replacement worker's claim or result.
  const ownsClaim = and(
    eq(orders.id, orderId),
    sql`${orders.metadata}->>${claimedKey}::text = ${claimedAt}::text`,
  );
  const email = claimedOrder.customerEmail;
  const recipient = audience === "admin"
    ? process.env.ADMIN_EMAIL?.trim() || fromEmail
    : email;

  try {
    const items = claimedOrder.items;
    if (!email || !recipient || !isStoredOrderItems(items) || items.length === 0) {
      throw new Error("Missing customer email or valid order items");
    }

    const metadata = claimedOrder.metadata as {
      customerDetails?: { name?: unknown };
    } | null;
    const storedName = metadata?.customerDetails?.name;
    const resolvedCustomerName = customerName?.trim()
      || (typeof storedName === "string" ? storedName.trim() : "")
      || email.split("@")[0]
      || "Customer";
    const isTest = claimedOrder.stripeSessionId.startsWith("cs_test_");
    const details = {
      customerName: resolvedCustomerName,
      orderNumber: String(claimedOrder.id),
      orderTotal: formatCurrency(claimedOrder.amount / 100, claimedOrder.currency),
      orderDate: claimedOrder.createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      items: items.map((item) => ({
        name: item.eventDate ? `${item.name} — ${item.eventDate}` : item.name,
        quantity: item.quantity,
        price: formatCurrency(item.price, claimedOrder.currency),
      })),
      includesCookingClass: items.some((item) => item.kind === "cooking_class"),
    };
    const result = await sendEmail({
      to: recipient,
      subject: audience === "admin"
        ? `${isTest ? "[TEST] " : ""}WaistLess Foods New Paid Order #${claimedOrder.id}`
        : `WaistLess Foods Order Confirmation #${claimedOrder.id}`,
      ...(audience === "admin" ? { replyTo: email } : {}),
      react: audience === "admin"
        ? React.createElement(AdminOrderNotificationEmail, {
          ...details,
          customerEmail: email,
          isTest,
        })
        : React.createElement(OrderConfirmationEmail, details),
    });

    if (result.error) throw new Error(result.error.message);

    await db
      .update(orders)
      .set({
        metadata: sql`(
          coalesce(${orders.metadata}, '{}'::jsonb)
          - ${claimedKey}::text - ${errorKey}::text
        ) || jsonb_build_object(${sentKey}::text, ${new Date().toISOString()}::text)`,
      })
      .where(ownsClaim);
  } catch (error) {
    await db
      .update(orders)
      .set({
        metadata: sql`(
          coalesce(${orders.metadata}, '{}'::jsonb) - ${claimedKey}::text
        ) || jsonb_build_object(
          ${errorKey}::text,
          ${error instanceof Error ? error.message : "Email delivery failed"}::text
        )`,
      })
      .where(ownsClaim);

    logError("order.email_failed", {
      orderId,
      audience,
      email: maskEmail(recipient),
      error,
    });
    throw new Error(`Order ${audience} email could not be sent.`);
  }

  logInfo("order.email_sent", { orderId, audience, email: maskEmail(recipient) });
  return true;
}

export async function sendOrderConfirmationOnce(
  options: SendOrderConfirmationOptions,
): Promise<boolean> {
  // Independent claims and results let a retry send only the notification due.
  const results = await Promise.allSettled([
    sendOrderEmailOnce(options, "customer"),
    sendOrderEmailOnce(options, "admin"),
  ]);
  if (results.some((result) => result.status === "rejected")) {
    throw new Error("One or more order emails could not be sent.");
  }
  return results.some((result) => result.status === "fulfilled" && result.value);
}
