import { requireAdminPageSession } from "@/lib/admin-page-session";
import AdminServiceInvoices from "@/components/admin/service-invoices";

export default async function Page({ searchParams }: { searchParams: Promise<{ agreement?: string }> }) {
  await requireAdminPageSession();
  const params = await searchParams;
  return <AdminServiceInvoices initialAgreementId={params.agreement || ""} />;
}
