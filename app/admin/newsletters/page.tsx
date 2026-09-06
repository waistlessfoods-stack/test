import { requireAdminPageSession } from "@/lib/admin-page-session";
import NewsletterDashboard from "@/components/admin/newsletter-dashboard";

export default async function AdminNewslettersPage() {
  await requireAdminPageSession();
  return <NewsletterDashboard />;
}
