import { AMBER_CONTRACT_SOURCE, AMBER_CONTRACT_TERMS } from "@/lib/service-agreement-original";
import type { AgreementContent } from "@/lib/service-agreement-content";

export { AMBER_CONTRACT_SOURCE, AMBER_CONTRACT_TERMS };
export const CONTRACT_VERSION = "amber-personal-chef-2026-11";
export const LEGACY_CHEF_SIGNATURE_CONSENT = "I am the Chef or authorized to sign on the Chef's behalf. I have reviewed this agreement, agree to its terms, and consent to signing it electronically by typing my full name.";
export const CHEF_SIGNATURE_CONSENT = "I am the Chef or authorized to sign on the Chef's behalf. I have reviewed this agreement, agree to its terms, and consent to signing it electronically using my selected signature.";
export const CONTRACT_FIELDS = [
  ["Chef business name", "text"], ["Agreement date", "date"],
  ["Deposit percentage", "percent"], ["Balance due date", "date"],
  ["Payment method", "text"], ["Daily late fee", "money"],
  ["Dietary notice days", "days"], ["Menu change notice days", "days"],
  ["Additional guest notice days", "days"], ["Additional guest fee", "money"],
  ["Cancellation notice days", "days"], ["Late cancellation days", "days"],
  ["Rescheduling notice days", "days"], ["Travel threshold miles", "number"],
  ["Travel rate per mile", "money"], ["Governing state", "text"],
  ["Business phone", "text"],
] as const;
export type ContractField = typeof CONTRACT_FIELDS[number][0];
export type AmberContract = { version: typeof CONTRACT_VERSION; values: Record<ContractField, string>; serviceApproved: boolean };

export const INTAKE_FIELDS = [
  ["address", "Customer address"], ["state", "State"], ["zip", "ZIP"],
  ["dateOfBirth", "Date of birth (optional)"], ["contactMethod", "Preferred contact method"],
  ["mailingList", "Mailing-list preference"], ["eventType", "Type of event"],
  ["theme", "Event theme / concept"], ["startTime", "Event start time"],
  ["endTime", "Event end time"], ["arrivalTime", "Chef arrival time"],
  ["completionTime", "Chef completion time"], ["timeZone", "Event time zone"],
  ["dietaryRestrictions", "Dietary restrictions"], ["allergies", "Allergies"],
  ["cuisine", "Preferred cuisine"], ["dietaryGoals", "Dietary goals / nutritional needs"],
] as const;
export type IntakeField = typeof INTAKE_FIELDS[number][0];
export type AgreementIntake = Record<IntakeField, string>;
export function emptyIntake(): AgreementIntake {
  return Object.fromEntries(INTAKE_FIELDS.map(([key]) => [key, ""])) as AgreementIntake;
}
export function emptyAmberContract(): AmberContract {
  return { version: CONTRACT_VERSION, values: Object.fromEntries(CONTRACT_FIELDS.map(([key]) => [key, ""])) as AmberContract["values"], serviceApproved: false };
}

export function resolvedAgreementTerms(content: AgreementContent): string {
  if (!content.contract) return content.terms;
  const dates = content.eventDate + (content.endDate ? ` through ${content.endDate}` : "");
  const values: Record<string, string> = {
    ...content.contract.values, "Customer name": content.name, "Event location": content.location,
    "Service dates": content.eventDate ? dates : "", "Agreed total": content.amount ? usd(content.amount / 100) : "",
    "Arrival time": content.intake?.arrivalTime ? `${content.intake.arrivalTime} ${content.intake.timeZone}`.trim() : "",
    "Completion time": content.intake?.completionTime ? `${content.intake.completionTime} ${content.intake.timeZone}`.trim() : "",
  };
  for (const [key, kind] of CONTRACT_FIELDS) {
    if (kind === "money" && values[key] && /^\d+(\.\d{1,2})?$/.test(values[key])) values[key] = usd(Number(values[key]));
    if (kind === "days" && values[key]) values[key] += Number(values[key]) === 1 ? " day" : " days";
  }
  return content.terms.replace(/\[([^\]]+)\]/g, (original, key: string) => values[key] || original);
}
function usd(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value); }
export function unresolvedAgreementFields(content: AgreementContent): string[] {
  const missing = new Set(Array.from(resolvedAgreementTerms(content).matchAll(/\[([^\]]+)\]/g), match => match[1]));
  if (content.contract) {
    for (const [key] of CONTRACT_FIELDS) if (!content.contract.values[key]) missing.add(key);
    if (!content.location) missing.add("Event location");
    for (const key of ["eventType", "startTime", "endTime", "arrivalTime", "completionTime", "timeZone", "dietaryRestrictions", "allergies"] as const) {
      if (!content.intake?.[key]) missing.add(INTAKE_FIELDS.find(([field]) => field === key)![1]);
    }
    if (content.service !== "private_chef" && !content.contract.serviceApproved) missing.add("Confirm Personal Chef contract applies to Catering");
  }
  return [...missing];
}
