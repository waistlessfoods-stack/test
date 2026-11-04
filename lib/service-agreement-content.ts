import { ServiceInvoiceError } from "@/lib/service-invoice-content";
import { CONTRACT_FIELDS, CONTRACT_VERSION, INTAKE_FIELDS, CHEF_SIGNATURE_CONSENT, LEGACY_CHEF_SIGNATURE_CONSENT, unresolvedAgreementFields, type AmberContract, type AgreementIntake } from "@/lib/service-agreement-template";
import { parseSignatureMark, type SignatureMark } from "@/lib/service-signature-content";

export const SIGNATURE_CONSENT = "I have read this agreement, agree to its terms, and consent to signing it electronically using my selected signature.";

export type AgreementContent = {
  name: string; email: string; phone: string; service: "private_chef" | "catering";
  title: string; eventDate: string; endDate: string; location: string;
  guests: number; amount: number; details: string; terms: string; source: string;
  contract?: AmberContract; intake?: AgreementIntake;
  chefSignature?: { name: string; consent: string; signedAt: string; mark?: SignatureMark };
};
export type AgreementView = {
  id: string; bookingId: number | null; version: number;
  status: "draft" | "issued" | "signed" | "void";
  content: AgreementContent; documentHash: string | null;
  expiresAt: string | null; viewedAt: string | null; signedAt: string | null;
  signature: { name: string; consent: string; signedAt: string; documentHash: string; mark?: SignatureMark; proofHash?: string } | null;
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
  const content: AgreementContent = { name, email, phone: field(data.phone, "phone", 40), service: data.service, title, eventDate, endDate,
    location: field(data.location, "location", 500), guests: Number(data.guests), amount: Number(data.amount),
    details: field(data.details, "event details", 4000, true), terms: field(data.terms, "approved contract terms", 40000, true), source: field(data.source, "contract source", 250) };
  // Omit new keys on legacy records: their canonical hashes must remain valid.
  if (data.intake !== undefined) {
    const intake = object(data.intake, "intake");
    content.intake = Object.fromEntries(INTAKE_FIELDS.map(([key, label]) => [key, field(intake[key], label, 1000, true)])) as AgreementIntake;
    for (const key of ["contactMethod", "mailingList"] as const) {
      const allowed = key === "contactMethod" ? ["", "Email", "Text", "Phone"] : ["", "Not asked", "No", "Yes"];
      if (!allowed.includes(content.intake[key])) throw new ServiceInvoiceError(`Check ${key === "contactMethod" ? "preferred contact method" : "mailing-list preference"}.`);
    }
    if (content.intake.dateOfBirth && !validDate(content.intake.dateOfBirth)) throw new ServiceInvoiceError("Use a valid date of birth.");
  }
  if (data.contract !== undefined) {
    const contract = object(data.contract, "contract");
    if (contract.version !== CONTRACT_VERSION || typeof contract.serviceApproved !== "boolean") throw new ServiceInvoiceError("Invalid contract template.");
    const values = object(contract.values, "contract values");
    content.contract = { version: CONTRACT_VERSION, serviceApproved: contract.serviceApproved, values: {} as AmberContract["values"] };
    for (const [key, kind] of CONTRACT_FIELDS) {
      const text = field(values[key], key, 250);
      if (text && (/[\[\]]/.test(text) || (kind === "date" && !validDate(text)) ||
        (["days", "number", "percent", "money"].includes(kind) && (!/^\d+(\.\d{1,2})?$/.test(text) || !Number.isFinite(Number(text)) || Number(text) > 99999.99)) ||
        (kind === "days" && !/^\d+$/.test(text)) || (kind === "percent" && Number(text) > 100))) {
        throw new ServiceInvoiceError(`Check ${key}${kind === "money" ? " (USD, up to two decimal places)" : ""}.`);
      }
      content.contract.values[key] = text;
    }
  }
  if (data.chefSignature !== undefined) {
    const signature = object(data.chefSignature, "Chef signature");
    const name = field(signature.name, "Chef signer name", 100);
    const signedAt = field(signature.signedAt, "Chef signature date", 30);
    if (name.length < 2 || (signature.consent !== CHEF_SIGNATURE_CONSENT && signature.consent !== LEGACY_CHEF_SIGNATURE_CONSENT) || !Number.isFinite(Date.parse(signedAt))) throw new ServiceInvoiceError("Invalid Chef signing record.");
    content.chefSignature = { name, consent: signature.consent, signedAt };
    if (signature.mark !== undefined) {
      try { content.chefSignature.mark = parseSignatureMark(signature.mark); }
      catch { throw new ServiceInvoiceError("Invalid Chef signature style."); }
    }
  }
  return content;
}
function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ServiceInvoiceError(`Invalid ${label}.`);
  return value as Record<string, unknown>;
}
function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function assertAgreementReady(content: AgreementContent, reviewed: unknown) {
  if (reviewed !== true) throw new ServiceInvoiceError("Review the agreement against Amber's approved contract before issuing it.");
  if (!content.eventDate || content.amount < 50 || content.terms.length < 20 || !content.source) throw new ServiceInvoiceError("Add the event date, agreed amount, approved contract text, and source before issuing.");
  const missing = unresolvedAgreementFields(content);
  if (missing.length) throw new ServiceInvoiceError(`Complete the contract before issuing: ${missing.join(", ")}.`);
}
export function canonicalAgreement(content: AgreementContent): string {
  // Select keys in a fixed order; JSONB storage does not preserve object order.
  return JSON.stringify(parseAgreementContent(content));
}
