type PricedItem = {
  price: number;
  quantity: number;
};

export const DEFAULT_SALES_TAX_RATE = 0.0825; // 8.25%

export function normalizeSalesTaxRate(
  rawRate: number | string | null | undefined,
  fallback: number = DEFAULT_SALES_TAX_RATE,
): number {
  if (rawRate === null || rawRate === undefined || rawRate === "") {
    return fallback;
  }

  const parsed =
    typeof rawRate === "number" ? rawRate : Number(String(rawRate).trim());

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  // Supports either decimal (0.0825) or percentage (8.25) input.
  const normalized = parsed > 1 ? parsed / 100 : parsed;

  // Cap at 100% for safety.
  return Math.min(normalized, 1);
}

export function getSalesTaxRate(): number {
  const rawRate =
    process.env.NEXT_PUBLIC_SALES_TAX_RATE ?? process.env.SALES_TAX_RATE;
  return normalizeSalesTaxRate(rawRate, DEFAULT_SALES_TAX_RATE);
}

export function calculateCartTotals(
  items: PricedItem[],
  taxRate: number = getSalesTaxRate(),
) {
  const subtotalCents = items.reduce(
    (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
    0,
  );
  const taxCents = Math.round(subtotalCents * taxRate);
  const totalCents = subtotalCents + taxCents;

  return {
    subtotalCents,
    taxCents,
    totalCents,
    subtotal: subtotalCents / 100,
    tax: taxCents / 100,
    total: totalCents / 100,
  };
}
