import Link from 'next/link';
import { requireAdminPageSession } from '@/lib/admin-page-session';
import { fetchServicesFromContentful } from '@/lib/contentful-management';
import { contentfulEntryEditorUrl } from '@/lib/contentful-editor-links';
import RefreshServiceContent from '@/components/admin/refresh-service-content';

export default async function ServiceContentPage() {
  await requireAdminPageSession();
  const services = await fetchServicesFromContentful();
  return <main className="min-h-screen bg-[#f0f5f5] px-4 py-8 sm:px-8"><div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
    <Link href="/admin" className="text-sm text-[#086b70] underline">Back to Admin Portal</Link>
    <h1 className="mt-6 text-2xl font-semibold text-[#173d40]">Service photos &amp; content</h1>
    <ol className="my-6 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-600">
      <li>Open your service in Contentful. <strong>Thumbnails Image</strong> is the main photo; add extra photos to <strong>Sub Images</strong>. You can add several photos and reorder them.</li>
      <li>Publish each new image, then publish the service entry. Saved drafts are not visible on the website.</li>
      <li>Select <strong>Refresh published services</strong>, then open the service preview. The gallery displays the main photo and every published Sub Image.</li>
    </ol>
    <RefreshServiceContent />
    <div className="mt-8 grid gap-4 sm:grid-cols-2">{services.map(service => <article key={service.id} className="rounded-xl border border-slate-200 p-5"><h2 className="font-semibold text-[#173d40]">{service.title}</h2><div className="mt-4 flex flex-wrap gap-4">{contentfulEntryEditorUrl(service.id) && <a href={contentfulEntryEditorUrl(service.id)!} target="_blank" rel="noopener noreferrer" className="text-sm text-[#086b70] underline">Edit in Contentful ↗</a>}<Link href={`/services/${service.slug}`} target="_blank" className="text-sm text-[#086b70] underline">Preview service ↗</Link></div></article>)}</div>
  </div></main>;
}
