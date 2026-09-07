import { createHash } from "node:crypto";

export type RosterMode = "live" | "test" | "unknown";
export type RosterStatus = "completed" | "pending" | "refunded" | "failed" | "all";
export type RosterOrder = {
  id: number; status: string; stripeSessionId: string; items: unknown;
  customerEmail: string | null; metadata: unknown; createdAt: Date;
};
export type ClassRegistration = {
  orderId: number; name: string; email: string; phone: string;
  seats: number; status: string; placedAt: string;
};
export type ClassRoster = {
  key: string; productId: string; title: string; eventDate: string;
  confirmedSeats: number; confirmedOrders: number; pendingSeats: number;
  recordedCapacities: number[]; registrations: ClassRegistration[];
};
export type RosterData = {
  classes: ClassRoster[]; mode: RosterMode; invalidLines: number; generatedAt: string;
};
export class ClassRosterError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
export function orderMode(sessionId: string): RosterMode {
  return sessionId.startsWith("cs_test_") ? "test" : sessionId.startsWith("cs_live_") ? "live" : "unknown";
}
export function parseRosterQuery(params: URLSearchParams) {
  const mode = params.get("mode") || "live";
  const status = params.get("status") || "completed";
  const key = params.get("class") || "";
  const query = (params.get("q") || "").trim();
  const format = params.get("format") || "json";
  if (!["live", "test", "unknown"].includes(mode)) throw new ClassRosterError("Invalid order mode.");
  if (!["completed", "pending", "refunded", "failed", "all"].includes(status)) throw new ClassRosterError("Invalid registration status.");
  if (key && !/^[a-f0-9]{64}$/.test(key)) throw new ClassRosterError("Invalid class selection.");
  if (query.length > 150) throw new ClassRosterError("Search is too long.");
  if (!["json", "csv"].includes(format)) throw new ClassRosterError("Invalid export format.");
  return { mode: mode as RosterMode, status: status as RosterStatus, key, query, format };
}

export function buildClassRosters(orders: RosterOrder[], mode: RosterMode): RosterData {
  const groups = new Map<string, ClassRoster>();
  let invalidLines = 0;
  // The most recent stored title is used; class identity is product + event date,
  // never its editable title. Never infer a class from a recipe's title.
  for (const order of [...orders].sort((a, b) => b.id - a.id)) {
    if (orderMode(order.stripeSessionId) !== mode) continue;
    if (!Array.isArray(order.items)) { invalidLines++; continue; }
    for (const raw of order.items) {
      const item = record(raw);
      if (item.kind !== "cooking_class") continue;
      const productId = text(item.id), title = text(item.name);
      if (!productId || !title || !Number.isSafeInteger(item.quantity) || Number(item.quantity) <= 0 || (item.eventDate !== undefined && typeof item.eventDate !== "string")) { invalidLines++; continue; }
      const eventDate = text(item.eventDate);
      const key = createHash("sha256").update(JSON.stringify([productId, eventDate])).digest("hex");
      let group = groups.get(key);
      if (!group) {
        group = { key, productId, title, eventDate, confirmedSeats: 0, confirmedOrders: 0, pendingSeats: 0, recordedCapacities: [], registrations: [] };
        groups.set(key, group);
      }
      const seats = Number(item.quantity);
      const existing = group.registrations.find(row => row.orderId === order.id);
      // Protect arithmetic even for malformed imported JSON.
      if (!Number.isSafeInteger((existing?.seats || 0) + seats) || !Number.isSafeInteger(group.confirmedSeats + seats) || !Number.isSafeInteger(group.pendingSeats + seats)) { invalidLines++; continue; }
      if (Number.isSafeInteger(item.capacity) && Number(item.capacity) > 0 && !group.recordedCapacities.includes(Number(item.capacity))) group.recordedCapacities.push(Number(item.capacity));
      if (order.status === "completed") { group.confirmedSeats += seats; if (!existing) group.confirmedOrders++; }
      if (order.status === "pending") group.pendingSeats += seats;
      if (existing) { existing.seats += seats; continue; }
      const details = record(record(order.metadata).customerDetails);
      group.registrations.push({ orderId: order.id, name: text(details.name), email: text(order.customerEmail) || text(details.email), phone: text(details.phone), seats, status: order.status, placedAt: order.createdAt.toISOString() });
    }
  }
  return { classes: [...groups.values()], mode, invalidLines, generatedAt: new Date().toISOString() };
}

export function filterRegistrations(rows: ClassRegistration[], status: RosterStatus, query: string) {
  const needle = query.trim().toLowerCase().replace(/^#(?=\d)/, "");
  return rows.filter(row => (status === "all" || row.status === status) && (!needle || [String(row.orderId), row.name, row.email, row.phone].some(value => value.toLowerCase().includes(needle))));
}
export function rosterCsvCell(value: string | number) {
  const raw = String(value);
  const safe = /^[\s\uFEFF]*[=+\-@]/.test(raw) || /^[\t\r\n]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function classRosterCsv(group: ClassRoster, rows: ClassRegistration[], mode: RosterMode) {
  const headings = ["Mode", "Class", "Class product ID", "Event date (as booked)", "Order number", "Purchaser", "Email", "Phone", "Seats", "Order status", "Order placed (UTC)"];
  return "\uFEFF" + [headings, ...rows.map(row => [mode, group.title, group.productId, group.eventDate, row.orderId, row.name, row.email, row.phone, row.seats, row.status, row.placedAt])].map(row => row.map(rosterCsvCell).join(",")).join("\r\n");
}
