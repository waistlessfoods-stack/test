import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import evidence from "@/lib/walkthrough-evidence.json";

export const runtime = "nodejs";
const names = new Set(evidence.screenshots.map(screenshot => screenshot.file));
const headers = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const denied = requireAdminSession(request);
  if (denied) return denied;
  const { name } = await params;
  if (!names.has(name) || !/^[a-z0-9-]+\.(jpg|png)$/.test(name)) {
    return NextResponse.json({ error: "Image not found" }, { status: 404, headers });
  }
  try {
    const bytes = await readFile(path.join(process.cwd(), "docs/walkthrough-evidence/2026-10-30", name));
    return new NextResponse(new Uint8Array(bytes), { headers: { ...headers, "Content-Type": name.endsWith(".png") ? "image/png" : "image/jpeg" } });
  } catch {
    return NextResponse.json({ error: "Image unavailable" }, { status: 404, headers });
  }
}
