import { requireAdminPageSession } from "@/lib/admin-page-session";
import NewsletterSubscribers from "@/components/admin/newsletter-subscribers";

export default async function NewsletterSubscribersPage() {
  await requireAdminPageSession();
  return <NewsletterSubscribers />;
}
