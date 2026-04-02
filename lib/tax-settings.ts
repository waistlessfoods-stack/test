import "server-only";

import { eq } from "drizzle-orm";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";
import {
  DEFAULT_SALES_TAX_RATE,
  getSalesTaxRate,
  normalizeSalesTaxRate,
} from "@/lib/pricing";

const SALES_TAX_RATE_KEY = "sales_tax_rate";
const LOCAL_SETTINGS_DIR = path.join(process.cwd(), ".runtime");
const LOCAL_SETTINGS_PATH = path.join(LOCAL_SETTINGS_DIR, "tax-settings.json");

function isTransientDbError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("etimedout") ||
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("connection reset") ||
    message.includes("epipe")
  );
}

async function withDbRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isTransientDbError(error) || attempt === maxAttempts - 1) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  throw lastError;
}

async function readLocalTaxRate(): Promise<number | null> {
  try {
    const raw = await readFile(LOCAL_SETTINGS_PATH, "utf-8");
    const data = JSON.parse(raw) as { salesTaxRate?: unknown };
    if (data.salesTaxRate === undefined || data.salesTaxRate === null) {
      return null;
    }

    if (
      typeof data.salesTaxRate !== "number" &&
      typeof data.salesTaxRate !== "string"
    ) {
      return null;
    }

    return normalizeSalesTaxRate(data.salesTaxRate, DEFAULT_SALES_TAX_RATE);
  } catch {
    return null;
  }
}

async function writeLocalTaxRate(rate: number) {
  await mkdir(LOCAL_SETTINGS_DIR, { recursive: true });
  await writeFile(
    LOCAL_SETTINGS_PATH,
    JSON.stringify({ salesTaxRate: rate }, null, 2),
    "utf-8",
  );
}

export async function getServerSalesTaxRate(): Promise<number> {
  const fallback = getSalesTaxRate();

  try {
    const rows = await withDbRetry(() =>
      db
        .select({ value: appSettings.value })
        .from(appSettings)
        .where(eq(appSettings.key, SALES_TAX_RATE_KEY))
        .limit(1),
    );

    const value = rows[0]?.value;
    const normalized = normalizeSalesTaxRate(value, fallback);
    await writeLocalTaxRate(normalized);
    return normalized;
  } catch (error) {
    console.error("[TaxSettings] Failed to load tax rate from DB:", error);

    const localRate = await readLocalTaxRate();
    if (localRate !== null) {
      return localRate;
    }

    return fallback;
  }
}

export async function setServerSalesTaxRate(rawRate: number | string) {
  const normalizedRate = normalizeSalesTaxRate(rawRate, DEFAULT_SALES_TAX_RATE);
  const value = String(normalizedRate);

  try {
    await withDbRetry(() =>
      db
        .insert(appSettings)
        .values({ key: SALES_TAX_RATE_KEY, value })
        .onConflictDoUpdate({
          target: appSettings.key,
          set: {
            value,
            updatedAt: new Date(),
          },
        }),
    );

    await writeLocalTaxRate(normalizedRate);
  } catch (error) {
    console.error("[TaxSettings] Failed to persist tax rate to DB:", error);
    throw new Error("Failed to persist tax rate to database.");
  }

  return normalizedRate;
}
