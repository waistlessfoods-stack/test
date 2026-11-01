import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  isValidAdminSessionToken,
} from "@/lib/admin-session";

export async function requireAdminPageSession(): Promise<void> {
  if (!(await hasAdminPageSession())) redirect("/admin");
}

export async function hasAdminPageSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return Boolean(process.env.ADMIN_PASSWORD && isValidAdminSessionToken(token));
}
