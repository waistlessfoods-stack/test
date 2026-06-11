export const HONEYPOT_FIELD = "companyWebsite";

export function isHoneypotFilled(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }

  const value = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof value === "string" && value.trim().length > 0;
}
