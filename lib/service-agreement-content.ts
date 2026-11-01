import { ServiceInvoiceError } from "@/lib/service-invoice-content";

export const SIGNATURE_CONSENT = "I have read this agreement, agree to its terms, and consent to signing it electronically by typing my full name.";

export type AgreementContent = {
  name: string; email: string; phone: string; service: "private_chef" | "catering";
  title: string; eventDate: string; endDate: string; location: string;
  guests: number; amount: number; details: string; terms: string; source: string;
};
export type AgreementView = {
  id: string; bookingId: number | null; version: number;
  status: "draft" | "issued" | "signed" | "void";
  content: AgreementContent; documentHash: string | null;
  expiresAt: string | null; viewedAt: string | null; signedAt: string | null;
  signature: { name: string; consent: string; signedAt: string; documentHash: string } | null;
  createdAt: string; updatedAt: string;
};

function field(value: unknown, label: string, max: number, multiline = false) {
  if (typeof value !== "string") throw new ServiceInvoiceError(`${label} must be text.`);
  const text = value.replace(/\r\n?/g, "\n").trim();
  if (text.length > max || (multiline ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/ : /[\x00-\x1f\x7f]/).test(text)) throw new ServiceInvoiceError(`Check ${label} (maximum ${max} characters).`);
  return text;
}
export function parseAgreementId(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new ServiceInvoiceError("Invalid agreement ID.");
  return value.toLowerCase();
}
export function parseAgreementContent(value: unknown): AgreementContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ServiceInvoiceError("Invalid agreement.");
  const data = value as Record<string, unknown>;
  const name = field(data.name, "customer name", 100);
  const email = field(data.email, "email", 254).toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ServiceInvoiceError("Add the customer's name and valid email.");
  if (data.service !== "private_chef" && data.service !== "catering") throw new ServiceInvoiceError("Choose Private Chef or Catering.");
  const title = field(data.title, "agreement title", 120);
  if (!title) throw new ServiceInvoiceError("Add an agreement title.");
  const eventDate = field(data.eventDate, "event date", 10);
  const endDate = field(data.endDate, "end date", 10);
  for (const date of [eventDate, endDate]) {
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) throw new ServiceInvoiceError("Use a valid event date.");
  }
  if (eventDate && endDate && endDate < eventDate) throw new ServiceInvoiceError("End date must not precede the event date.");
  if (!Number.isSafeInteger(data.guests) || Number(data.guests) < 1 || Number(data.guests) > 10000) throw new ServiceInvoiceError("Enter a whole guest count from 1 to 10,000.");
  if (!Number.isSafeInteger(data.amount) || Number(data.amount) < 0 || Number(data.amount) > 9999999) throw new ServiceInvoiceError("Enter an agreed amount in whole cents, up to $99,999.99.");
  return { name, email, phone: field(data.phone, "phone", 40), service: data.service, title, eventDate, endDate,
    location: field(data.location, "location", 500), guests: Number(data.guests), amount: Number(data.amount),
    details: field(data.details, "event details", 4000, true), terms: field(data.terms, "approved contract terms", 40000, true), source: field(data.source, "contract source", 250) };
}
export function assertAgreementReady(content: AgreementContent, reviewed: unknown) {
  if (reviewed !== true) throw new ServiceInvoiceError("Review the agreement against Amber's approved contract before issuing it.");
  if (!content.eventDate || content.amount < 50 || content.terms.length < 20 || !content.source) throw new ServiceInvoiceError("Add the event date, agreed amount, approved contract text, and source before issuing.");
}
export function canonicalAgreement(content: AgreementContent): string {
  // Select keys in a fixed order; JSONB storage does not preserve object order.
  return JSON.stringify(parseAgreementContent(content));
}
