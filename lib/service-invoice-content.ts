export const SERVICE_INVOICE_SOURCE = "waistless-service-v1";

export class ServiceInvoiceError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export type ServiceInvoiceInput = {
  name: string; email: string; service: "private_chef" | "catering";
  title: string; eventDate: string; notes: string; daysUntilDue: number;
  items: { description: string; quantity: number; unitAmount: number }[];
};

export type ServiceInvoiceView = {
  id: string; number: string | null; status: string; name: string; email: string;
  service: string; title: string; eventDate: string; notes: string;
  total: number; paid: number; remaining: number; currency: string;
  created: number; dueDate: number | null; paidAt: number | null;
  hostedUrl: string | null; pdfUrl: string | null; live: boolean; ready: boolean; overdue: boolean;
  items: { description: string; quantity: number; amount: number }[];
};

function text(value: unknown, field: string, max: number, required = true, multiline = false) {
  if (typeof value !== "string") throw new ServiceInvoiceError(`${field} must be text.`);
  const result = value.trim();
  if ((required && !result) || result.length > max || (multiline ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/ : /[\x00-\x1f\x7f]/).test(result)) {
    throw new ServiceInvoiceError(`Check ${field} (maximum ${max} characters).`);
  }
  return result;
}

export function parseServiceInvoice(value: unknown): ServiceInvoiceInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ServiceInvoiceError("Invalid invoice.");
  const data = value as Record<string, unknown>;
  const name = text(data.name, "customer name", 100);
  const email = text(data.email, "customer email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ServiceInvoiceError("Enter a valid customer email.");
  if (data.service !== "private_chef" && data.service !== "catering") throw new ServiceInvoiceError("Choose private chef or catering.");
  const title = text(data.title, "title", 120);
  const eventDate = text(data.eventDate ?? "", "event date", 10, false);
  if (eventDate && (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || Number.isNaN(Date.parse(eventDate)) || new Date(eventDate).toISOString().slice(0, 10) !== eventDate)) throw new ServiceInvoiceError("Enter a valid event date.");
  const notes = text(data.notes ?? "", "customer notes", 1500, false, true);
  const daysUntilDue = data.daysUntilDue;
  if (!Number.isInteger(daysUntilDue) || Number(daysUntilDue) < 1 || Number(daysUntilDue) > 90) throw new ServiceInvoiceError("Payment terms must be 1 to 90 days after issue.");
  if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 8) throw new ServiceInvoiceError("Add 1 to 8 invoice lines.");
  const items = data.items.map((item: Record<string, unknown>) => {
    if (!item || typeof item !== "object") throw new ServiceInvoiceError("Invalid invoice line.");
    const description = text(item.description, "line description", 200);
    if (!Number.isSafeInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 1000) throw new ServiceInvoiceError("Quantities must be whole numbers from 1 to 1,000.");
    if (!Number.isSafeInteger(item.unitAmount) || Number(item.unitAmount) < 1) throw new ServiceInvoiceError("Prices must be positive whole cents.");
    return { description, quantity: Number(item.quantity), unitAmount: Number(item.unitAmount) };
  });
  const total = invoiceInputTotal({ items });
  if (!Number.isSafeInteger(total) || total < 50 || total > 9999999) throw new ServiceInvoiceError("Invoice total must be between $0.50 and $99,999.99 USD.");
  return { name, email, service: data.service, title, eventDate, notes, daysUntilDue: Number(daysUntilDue), items };
}

export function invoiceInputTotal(input: Pick<ServiceInvoiceInput, "items">) {
  return input.items.reduce((sum, item) => sum + item.quantity * item.unitAmount, 0);
}

export function parseInvoiceId(value: string) {
  if (!/^in_[A-Za-z0-9]{5,100}$/.test(value)) throw new ServiceInvoiceError("Invalid invoice ID.");
  return value;
}

export function parseInvoiceRequestKey(value: string | null) {
  if (!value || !/^\d{13}-[a-f0-9-]{36}$/.test(value)) throw new ServiceInvoiceError("A valid submission key is required.");
  const age = Date.now() - Number(value.slice(0, 13));
  // Stripe retains idempotency results for at least 24 hours. Never silently
  // replay an expired submission outside that window.
  if (age < -60000 || age > 20 * 60 * 60 * 1000) throw new ServiceInvoiceError("This submission expired. Refresh and check existing invoices before creating another.", 409);
  return value;
}

export function serviceMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
