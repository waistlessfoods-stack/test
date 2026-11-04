import { createHash, randomBytes, randomUUID } from "node:crypto";
import { assertAgreementReady, canonicalAgreement, parseAgreementContent, SIGNATURE_CONSENT, type AgreementContent, type AgreementView } from "@/lib/service-agreement-content";
import { ServiceInvoiceError } from "@/lib/service-invoice-content";
import { AMBER_CONTRACT_SOURCE, AMBER_CONTRACT_TERMS, CHEF_SIGNATURE_CONSENT, emptyAmberContract, emptyIntake, resolvedAgreementTerms } from "@/lib/service-agreement-template";
import { validateSignatureMark } from "@/lib/service-signature-validation";
import { parseSignatureMark } from "@/lib/service-signature-content";

type Row = Record<string, unknown>;
export type WorkflowQuery = (sql: string, parameters?: (string | number | boolean | null)[]) => Promise<Row[]>;
export type WorkflowDatabase = { query: WorkflowQuery; transaction: <T>(work: (query: WorkflowQuery) => Promise<T>) => Promise<T> };
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const iso = (value: unknown) => value ? (value instanceof Date ? value : new Date(String(value))).toISOString() : null;
function signatureProof(signature: NonNullable<AgreementView["signature"]>) {
  return digest(JSON.stringify({ name: signature.name, consent: signature.consent, signedAt: signature.signedAt, documentHash: signature.documentHash, mark: parseSignatureMark(signature.mark) }));
}

export function agreementView(row: Row): AgreementView {
  const signature = row.signature as AgreementView["signature"];
  if (row.status === "issued" || row.status === "signed") {
    if (digest(canonicalAgreement(row.content as AgreementContent)) !== row.document_hash ||
      (row.status === "signed" && (signature?.documentHash !== row.document_hash || (signature?.proofHash && signature.proofHash !== signatureProof(signature))))) {
      throw new ServiceInvoiceError("The stored agreement does not match its issued copy. Contact Chef Amber before proceeding.", 409);
    }
  }
  return { id: String(row.id), bookingId: row.booking_id === null ? null : Number(row.booking_id), version: Number(row.version),
    status: row.status as AgreementView["status"], content: row.content as AgreementContent,
    documentHash: row.document_hash ? String(row.document_hash) : null, expiresAt: iso(row.expires_at),
    viewedAt: iso(row.viewed_at), signedAt: iso(row.signed_at), signature: row.signature as AgreementView["signature"],
    createdAt: iso(row.created_at)!, updatedAt: iso(row.updated_at)! };
}
function validVersion(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1) throw new ServiceInvoiceError("Reload the agreement before continuing.");
  return Number(value);
}
function bookingService(slug: unknown): AgreementContent["service"] {
  if (slug === "private" || slug === "private-chef") return "private_chef";
  if (slug === "catering") return "catering";
  throw new ServiceInvoiceError("Agreements are available for Private Chef and Catering requests only.");
}
function requestedDate(value: unknown): string {
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  // Booking forms store an English month name and an ordinal day. Do not guess
  // locale-dependent numeric dates or silently convert a time-zone timestamp.
  if (!/^[A-Za-z]+ \d{1,2}(st|nd|rd|th)?, \d{4}$/.test(text)) return "";
  const date = new Date(text.replace(/(\d)(st|nd|rd|th)/g, "$1") + " UTC");
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : "";
}

export function createAgreementService(database: WorkflowDatabase) {
  async function read(id: string) {
    const [row] = await database.query("SELECT * FROM service_agreements WHERE id=$1", [id]);
    if (!row) throw new ServiceInvoiceError("Agreement not found.", 404);
    return agreementView(row);
  }
  async function list(bookingId?: number) {
    return (await database.query(`SELECT * FROM service_agreements ${bookingId ? "WHERE booking_id=$1" : ""} ORDER BY created_at DESC LIMIT 200`, bookingId ? [bookingId] : [])).map(agreementView);
  }
  async function createFromBooking(bookingId: number) {
    return database.transaction(async query => {
      // One editable draft per inquiry; retries and concurrent clicks reuse it.
      const [booking] = await query("SELECT * FROM bookings WHERE id=$1 FOR UPDATE", [bookingId]);
      if (!booking) throw new ServiceInvoiceError("Booking not found.", 404);
      const service = bookingService(booking.service_slug);
      const [existing] = await query("SELECT * FROM service_agreements WHERE booking_id=$1 AND status='draft' ORDER BY created_at DESC LIMIT 1", [bookingId]);
      if (existing) return agreementView(existing);
      const content = parseAgreementContent({ name: `${booking.first_name} ${booking.last_name}`, email: booking.email,
        phone: booking.phone, guests: booking.guests, service, title: `${service === "private_chef" ? "Private Chef" : "Catering"} Agreement`,
        eventDate: requestedDate(booking.preferred_date), endDate: "", location: "", amount: 0,
        terms: AMBER_CONTRACT_TERMS, source: AMBER_CONTRACT_SOURCE, contract: emptyAmberContract(), intake: emptyIntake(),
        details: `Requested date: ${booking.preferred_date}${booking.alternative_date ? `\nAlternative date: ${booking.alternative_date}` : ""}\n\n${booking.notes}` });
      const [row] = await query("INSERT INTO service_agreements(id,booking_id,content) VALUES ($1,$2,$3::jsonb) RETURNING *", [randomUUID(), bookingId, JSON.stringify(content)]);
      return agreementView(row);
    });
  }
  async function save(id: string, version: unknown, input: unknown) {
    const content = parseAgreementContent(input);
    if (content.chefSignature) throw new ServiceInvoiceError("Chef signatures are recorded only when issuing the reviewed agreement.");
    const [row] = await database.query("UPDATE service_agreements SET content=$3::jsonb,version=version+1,updated_at=now() WHERE id=$1 AND version=$2 AND status='draft' RETURNING *", [id, validVersion(version), JSON.stringify(content)]);
    if (!row) throw new ServiceInvoiceError("This agreement changed or is no longer an editable draft. Reload before saving.", 409);
    return agreementView(row);
  }
  async function issue(id: string, version: unknown, reviewed: unknown, chefName: unknown, chefConsent: unknown, chefMark?: unknown) {
    const mark = validateSignatureMark(chefMark);
    return database.transaction(async query => {
      const [row] = await query("SELECT * FROM service_agreements WHERE id=$1 FOR UPDATE", [id]);
      if (!row || row.status !== "draft" || Number(row.version) !== validVersion(version)) throw new ServiceInvoiceError("Reload the current draft before issuing it.", 409);
      const content = parseAgreementContent(row.content);
      assertAgreementReady(content, reviewed);
      if (chefConsent !== true || typeof chefName !== "string" || chefName.trim().length < 2 || chefName.trim().length > 100 || /[\x00-\x1f\x7f]/.test(chefName)) throw new ServiceInvoiceError("Type the Chef signer's full name and confirm authorization and electronic-signing consent.");
      content.terms = resolvedAgreementTerms(content);
      content.chefSignature = { name: chefName.trim(), consent: CHEF_SIGNATURE_CONSENT, signedAt: new Date().toISOString(), mark };
      const token = randomBytes(32).toString("base64url");
      const hash = digest(canonicalAgreement(content));
      const [issued] = await query("UPDATE service_agreements SET status='issued',document_hash=$2,token_hash=$3,content=$4::jsonb,expires_at=now()+interval '30 days',version=version+1,updated_at=now() WHERE id=$1 RETURNING *", [id, hash, digest(token), JSON.stringify(content)]);
      return { agreement: agreementView(issued), token };
    });
  }
  async function voidAgreement(id: string, version: unknown) {
    const [row] = await database.query("UPDATE service_agreements SET status='void',token_hash=NULL,version=version+1,updated_at=now() WHERE id=$1 AND version=$2 AND status IN ('draft','issued') RETURNING *", [id, validVersion(version)]);
    if (!row) throw new ServiceInvoiceError("Only a current unsigned agreement can be voided.", 409);
    return agreementView(row);
  }
  async function renewLink(id: string, version: unknown) {
    const token = randomBytes(32).toString("base64url");
    const [row] = await database.query("UPDATE service_agreements SET token_hash=$3,expires_at=now()+interval '30 days',version=version+1,updated_at=now() WHERE id=$1 AND version=$2 AND status='issued' RETURNING *", [id, validVersion(version), digest(token)]);
    if (!row) throw new ServiceInvoiceError("Only a current, unsigned agreement can receive a replacement signing link.", 409);
    return { agreement: agreementView(row), token };
  }
  function tokenHash(value: unknown) {
    if (typeof value !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(value)) throw new ServiceInvoiceError("This agreement link is unavailable or expired.", 404);
    return digest(value);
  }
  async function review(token: unknown) {
    const [row] = await database.query("UPDATE service_agreements SET viewed_at=coalesce(viewed_at,now()) WHERE token_hash=$1 AND status IN ('issued','signed') AND expires_at>now() RETURNING *", [tokenHash(token)]);
    if (!row) throw new ServiceInvoiceError("This agreement link is unavailable or expired. Contact Chef Amber for a new agreement.", 404);
    return agreementView(row);
  }
  async function signingCopy(id: string, token: unknown) {
    const [row] = await database.query("SELECT * FROM service_agreements WHERE id=$1 AND token_hash=$2 AND status='issued' AND expires_at>now()", [id, tokenHash(token)]);
    if (!row) throw new ServiceInvoiceError("Generate a current signing link before emailing this agreement.", 409);
    return agreementView(row);
  }
  async function sign(token: unknown, documentHash: unknown, name: unknown, consent: unknown, inputMark?: unknown) {
    const hash = tokenHash(token);
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100 || /[\x00-\x1f\x7f]/.test(name)) throw new ServiceInvoiceError("Type your full name to sign.");
    if (consent !== true) throw new ServiceInvoiceError("Confirm that you agree to sign electronically.");
    const mark = validateSignatureMark(inputMark);
    return database.transaction(async query => {
      const [row] = await query("SELECT * FROM service_agreements WHERE token_hash=$1 AND status IN ('issued','signed') AND expires_at>now() FOR UPDATE", [hash]);
      if (!row) throw new ServiceInvoiceError("This agreement link is unavailable or expired.", 404);
      if (row.document_hash !== documentHash || digest(canonicalAgreement(row.content as AgreementContent)) !== documentHash) throw new ServiceInvoiceError("The agreement does not match your preview. Reload before signing.", 409);
      if (row.status === "signed") {
        const saved = row.signature as NonNullable<AgreementView["signature"]>;
        if (saved.name !== name.trim() || JSON.stringify(parseSignatureMark(saved.mark)) !== JSON.stringify(mark)) throw new ServiceInvoiceError("This agreement has already been signed.", 409);
        agreementView(row); // Verify stored image proof before accepting a retry.
        return agreementView(row); // An identical retry cannot overwrite proof.
      }
      const signedAt = new Date().toISOString();
      const signature: NonNullable<AgreementView["signature"]> = { name: name.trim(), consent: SIGNATURE_CONSENT, signedAt, documentHash: String(documentHash), mark };
      signature.proofHash = signatureProof(signature);
      const [signed] = await query("UPDATE service_agreements SET status='signed',signed_at=$2,signature=$3::jsonb,version=version+1,updated_at=now() WHERE id=$1 RETURNING *", [String(row.id), signedAt, JSON.stringify(signature)]);
      return agreementView(signed);
    });
  }
  async function memberList(email: string) {
    return (await database.query("SELECT * FROM service_agreements WHERE content->>'email'=$1 AND status IN ('issued','signed') ORDER BY created_at DESC LIMIT 200", [email])).map(agreementView);
  }
  return { read, list, createFromBooking, save, issue, renewLink, signingCopy, voidAgreement, review, sign, memberList };
}
