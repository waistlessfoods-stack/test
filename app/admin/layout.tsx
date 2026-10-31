import { ReactNode } from "react";
import {
  AdminAccessGate,
  AdminAuthProvider,
} from "@/components/admin/admin-auth";
import { buildNoIndexMetadata } from "@/lib/seo";
import AdminNavigation from "@/components/admin/admin-navigation";

export const metadata = buildNoIndexMetadata(
  "Admin Portal",
  "Private admin management area for WaistLess Foods."
);

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminAccessGate><AdminNavigation />{children}</AdminAccessGate>
    </AdminAuthProvider>
  );
}
