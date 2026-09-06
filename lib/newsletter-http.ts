import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { NewsletterInputError } from "@/lib/newsletter-content";

export const privateHeaders = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };

export function newsletterAdminGuard(request: NextRequest) {
  const error = requireAdminSession(request);
  if (error) return error;
  if (request.method !== "GET" && request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "A same-origin request is required." }, { status: 403, headers: privateHeaders });
  }
  return null;
}

export async function newsletterJson(request: NextRequest): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > 70000) throw new NewsletterInputError("Request is too large.");
  try {
    const result = JSON.parse(text);
    if (!result || typeof result !== "object" || Array.isArray(result)) throw new Error();
    return result;
  } catch { throw new NewsletterInputError("Invalid JSON request."); }
}

export function newsletterError(error: unknown) {
  if (error instanceof NewsletterInputError) return NextResponse.json({ error: error.message }, { status: 400, headers: privateHeaders });
  console.error("Newsletter operation failed", error instanceof Error ? error.name : "UnknownError");
  return NextResponse.json({ error: "Newsletter data is unavailable. Please retry; if this persists, check the database migration and server logs." }, { status: 500, headers: privateHeaders });
}
