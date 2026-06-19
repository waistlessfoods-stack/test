import { ReactNode } from "react";
import {
  AdminAccessGate,
  AdminAuthProvider,
} from "@/components/admin/admin-auth";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Admin Portal",
  "Private admin management area for WaistLess Foods."
);

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminAccessGate>{children}</AdminAccessGate>
    </AdminAuthProvider>
  );
}
