import { requireAdminPageSession } from "@/lib/admin-page-session";
import AdminServiceInvoices from "@/components/admin/service-invoices";

export default async function Page() {
  await requireAdminPageSession();
  return <AdminServiceInvoices />;
}
