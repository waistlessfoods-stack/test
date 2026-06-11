import { clearAdminSessionCookie } from "@/lib/admin-session";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ authenticated: false }, { status: 200 });
  clearAdminSessionCookie(response);
  return response;
}
