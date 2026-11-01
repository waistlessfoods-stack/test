import { requireAdminPageSession } from "@/lib/admin-page-session";
import AdminServiceAgreements from "@/components/admin/service-agreements";

export default async function Page({ searchParams }: { searchParams: Promise<{ booking?: string; agreement?: string }> }) {
  await requireAdminPageSession();
  const params = await searchParams;
  return <AdminServiceAgreements initialBookingId={params.booking || ""} initialAgreementId={params.agreement || ""} />;
}
