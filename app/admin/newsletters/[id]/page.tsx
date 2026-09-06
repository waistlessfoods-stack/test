import { notFound } from "next/navigation";
import { requireAdminPageSession } from "@/lib/admin-page-session";
import NewsletterEditor from "@/components/admin/newsletter-editor";

export default async function AdminNewsletterEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPageSession();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  return <NewsletterEditor id={id} />;
}
