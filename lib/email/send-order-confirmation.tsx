import React from "react";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { isStoredOrderItems } from "@/lib/order-checkout-snapshot";
import { logError, logInfo, maskEmail } from "@/lib/structured-log";
import OrderConfirmationEmail from "@/lib/email/templates/order-confirmation-email";
import { sendEmail } from "@/lib/email/mailer";

type SendOrderConfirmationOptions = {
  orderId: number;
  customerName?: string | null;
};

const CLAIM_TIMEOUT_MS = 10 * 60 * 1000;

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

export async function sendOrderConfirmationOnce({
  orderId,
  customerName,
}: SendOrderConfirmationOptions): Promise<boolean> {
  const claimedAt = new Date().toISOString();
  const staleBefore = new Date(Date.now() - CLAIM_TIMEOUT_MS).toISOString();
  const [claimedOrder] = await db
    .update(orders)
    .set({
      metadata: sql`(
        coalesce(${orders.metadata}, '{}'::jsonb)
        - 'orderConfirmationError'
      ) || jsonb_build_object('orderConfirmationClaimedAt', ${claimedAt})`,
    })
    .where(
      and(
        eq(orders.id, orderId),
        sql`${orders.metadata}->>'orderConfirmationSentAt' is null`,
        sql`(
          ${orders.metadata}->>'orderConfirmationClaimedAt' is null
          or ${orders.metadata}->>'orderConfirmationClaimedAt' < ${staleBefore}
        )`
      )
    )
    .returning();

  if (!claimedOrder) {
    return false;
  }

  const email = claimedOrder.customerEmail;
  const items = claimedOrder.items;

  if (!email || !isStoredOrderItems(items) || items.length === 0) {
    await db
      .update(orders)
      .set({
        metadata: sql`(
          coalesce(${orders.metadata}, '{}'::jsonb)
          - 'orderConfirmationClaimedAt'
        ) || jsonb_build_object(
          'orderConfirmationError',
          'Missing customer email or valid order items'
        )`,
      })
      .where(eq(orders.id, orderId));

    logError("order.confirmation_invalid_order", {
      orderId,
      hasEmail: Boolean(email),
      hasValidItems: isStoredOrderItems(items),
    });
    throw new Error("Order confirmation data is incomplete.");
  }

  const resolvedCustomerName =
    customerName?.trim() || email.split("@")[0] || "there";
  const result = await sendEmail({
    to: email,
    subject: `WaistLess Foods Order Confirmation #${claimedOrder.id}`,
    react: React.createElement(OrderConfirmationEmail, {
      customerName: resolvedCustomerName,
      orderNumber: String(claimedOrder.id),
      orderTotal: formatCurrency(
        claimedOrder.amount / 100,
        claimedOrder.currency
      ),
      orderDate: claimedOrder.createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      items: items.map((item) => ({
        name: item.eventDate
          ? `${item.name} — ${item.eventDate}`
          : item.name,
        quantity: item.quantity,
        price: formatCurrency(item.price, claimedOrder.currency),
      })),
      includesCookingClass: items.some(
        (item) => item.kind === "cooking_class"
      ),
    }),
  });

  if (result.error) {
    await db
      .update(orders)
      .set({
        metadata: sql`(
          coalesce(${orders.metadata}, '{}'::jsonb)
          - 'orderConfirmationClaimedAt'
        ) || jsonb_build_object(
          'orderConfirmationError',
          ${result.error.message}
        )`,
      })
      .where(eq(orders.id, orderId));

    logError("order.confirmation_failed", {
      orderId,
      email: maskEmail(email),
      error: result.error,
    });
    throw new Error("Order confirmation email could not be sent.");
  }

  const sentAt = new Date().toISOString();
  await db
    .update(orders)
    .set({
      metadata: sql`(
        coalesce(${orders.metadata}, '{}'::jsonb)
        - 'orderConfirmationClaimedAt'
        - 'orderConfirmationError'
      ) || jsonb_build_object('orderConfirmationSentAt', ${sentAt})`,
    })
    .where(eq(orders.id, orderId));

  logInfo("order.confirmation_sent", {
    orderId,
    email: maskEmail(email),
  });
  return true;
}
