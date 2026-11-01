import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-session";

export async function POST(request: NextRequest) {
  const denied = requireAdminSession(request); if (denied) return denied;
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "A same-origin request is required." }, { status: 403 });
  revalidateTag("recipes-page", { expire: 0 });
  revalidateTag("shop-page", { expire: 0 });
  return NextResponse.json({ message: "Published recipe content refreshed. Unpublished Contentful drafts remain private." }, { headers: { "Cache-Control": "private, no-store" } });
}
