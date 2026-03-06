import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const configuredSecret = process.env.CONTENTFUL_REVALIDATE_SECRET;

  if (!configuredSecret) {
    return NextResponse.json(
      { error: "Missing CONTENTFUL_REVALIDATE_SECRET on server." },
      { status: 500 }
    );
  }

  let body: { secret?: string; tag?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Allow empty JSON body when secret is sent in headers.
  }

  const providedSecret =
    request.headers.get("x-revalidate-secret") || body.secret;

  if (!providedSecret || providedSecret !== configuredSecret) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 401 });
  }

  const tag = body.tag || "header-settings";
  revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: true, tag, now: Date.now() });
}
