import Stripe from "stripe";

export type StoredOrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imagePath?: string;
};

export type OrderCheckoutSnapshot = {
  currency: string;
  items: StoredOrderItem[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  taxRate: number | null;
  taxLabel: string;
};

type SnapshotSource = {
  currency: string;
  items: StoredOrderItem[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  taxRate: number | null;
};

type ExistingOrderSource = {
  amount: number;
  currency: string;
  items: unknown;
  metadata: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isStoredOrderItems(value: unknown): value is StoredOrderItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        Number.isFinite(item.price) &&
        typeof item.quantity === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        (item.imagePath === undefined || typeof item.imagePath === "string"),
    )
  );
}

function getTaxLabel(taxRate: number | null) {
  if (taxRate === null) {
    return "Sales Tax";
  }

  return `Sales Tax (${(taxRate * 100).toFixed(2)}%)`;
}

export function createOrderCheckoutSnapshot(
  source: SnapshotSource,
): OrderCheckoutSnapshot {
  return {
    currency: source.currency,
    items: source.items,
    subtotalCents: source.subtotalCents,
    taxCents: source.taxCents,
    totalCents: source.totalCents,
    taxRate: source.taxRate,
    taxLabel: getTaxLabel(source.taxRate),
  };
}

function isOrderCheckoutSnapshot(value: unknown): value is OrderCheckoutSnapshot {
  return (
    isRecord(value) &&
    typeof value.currency === "string" &&
    isStoredOrderItems(value.items) &&
    typeof value.subtotalCents === "number" &&
    Number.isInteger(value.subtotalCents) &&
    typeof value.taxCents === "number" &&
    Number.isInteger(value.taxCents) &&
    typeof value.totalCents === "number" &&
    Number.isInteger(value.totalCents) &&
    (value.taxRate === null ||
      (typeof value.taxRate === "number" && Number.isFinite(value.taxRate))) &&
    typeof value.taxLabel === "string"
  );
}

function getSnapshotFromMetadata(metadata: unknown): OrderCheckoutSnapshot | null {
  if (!isRecord(metadata) || !("checkoutSnapshot" in metadata)) {
    return null;
  }

  const snapshot = metadata.checkoutSnapshot;
  return isOrderCheckoutSnapshot(snapshot) ? snapshot : null;
}

export function resolveOrderCheckoutSnapshot(
  order: ExistingOrderSource,
): OrderCheckoutSnapshot | null {
  const metadataSnapshot = getSnapshotFromMetadata(order.metadata);
  if (metadataSnapshot) {
    return metadataSnapshot.totalCents === order.amount ? metadataSnapshot : null;
  }

  if (!isStoredOrderItems(order.items) || order.items.length === 0) {
    return null;
  }

  const subtotalCents = order.items.reduce(
    (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
    0,
  );
  const taxCents = order.amount - subtotalCents;

  if (!Number.isInteger(order.amount) || subtotalCents <= 0 || taxCents < 0) {
    return null;
  }

  return createOrderCheckoutSnapshot({
    currency: order.currency,
    items: order.items,
    subtotalCents,
    taxCents,
    totalCents: order.amount,
    taxRate: null,
  });
}

export function buildStripeLineItemsFromSnapshot(
  snapshot: OrderCheckoutSnapshot,
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    snapshot.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: snapshot.currency,
        unit_amount: Math.round(item.price * 100),
        product_data: {
          name: item.name,
          ...(item.imagePath ? { images: [item.imagePath] } : {}),
        },
      },
    }));

  if (snapshot.taxCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: snapshot.currency,
        unit_amount: snapshot.taxCents,
        product_data: {
          name: snapshot.taxLabel,
        },
      },
    });
  }

  return lineItems;
}
