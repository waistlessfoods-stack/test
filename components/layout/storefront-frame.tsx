"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// Handle client-side navigation too: root layouts persist between routes.
export default function StorefrontFrame({ children, header, footer }: {
  children: ReactNode; header: ReactNode; footer: ReactNode;
}) {
  const pathname = usePathname();
  const isRosterWorkspace = pathname === "/admin/class-rosters" || pathname.startsWith("/admin/class-rosters/");
  return <>{!isRosterWorkspace && header}{children}{!isRosterWorkspace && footer}</>;
}
