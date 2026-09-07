import "server-only";
import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { buildClassRosters, ClassRosterError, type RosterMode } from "@/lib/class-roster";

export async function readClassRosters(mode: RosterMode) {
  const modeCondition = mode === "live" ? sql`left(${orders.stripeSessionId}, 8) = 'cs_live_'` : mode === "test" ? sql`left(${orders.stripeSessionId}, 8) = 'cs_test_'` : sql`left(${orders.stripeSessionId}, 8) not in ('cs_live_', 'cs_test_')`;
  const rows = await db.select({ id: orders.id, status: orders.status, stripeSessionId: orders.stripeSessionId, items: orders.items, customerEmail: orders.customerEmail, metadata: orders.metadata, createdAt: orders.createdAt }).from(orders).where(sql`${modeCondition} and ${orders.items} @> '[{"kind":"cooking_class"}]'::jsonb`).orderBy(desc(orders.id)).limit(5001);
  if (rows.length > 5000) throw new ClassRosterError("This roster exceeds 5,000 class orders. Export is paused to avoid incomplete counts; add date-range pagination before continuing.", 503);
  return buildClassRosters(rows, mode);
}
