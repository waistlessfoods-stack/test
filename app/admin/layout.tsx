import { ReactNode } from "react";
import {
  AdminAccessGate,
  AdminAuthProvider,
} from "@/components/admin/admin-auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminAccessGate>{children}</AdminAccessGate>
    </AdminAuthProvider>
  );
}
