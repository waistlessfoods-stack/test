"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NewsletterContent } from "@/lib/newsletter-content";
import NewsletterArticle from "@/components/newsletter-article";

type Issue = NewsletterContent & { id: number; version: number; status: "draft" | "published"; updatedAt: string };
const empty: NewsletterContent = { title: "", subject: "", previewText: "", body: "", ctaLabel: "", ctaUrl: "" };
const fieldClass = "mt-2 w-full rounded-lg border border-[#cbdcd6] bg-white px-3 py-2.5 text-sm text-[#173d40] outline-none focus:border-[#086b70] focus:ring-2 focus:ring-[#086b70]/15";

export default function NewsletterEditor({ id }: { id: string }) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [content, setContent] = useState<NewsletterContent>(empty);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailPreview, setEmailPreview] = useState(false);
  const dirty = !!issue && Object.keys(empty).some(key => content[key as keyof NewsletterContent] !== issue[key as keyof NewsletterContent]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/newsletters/${id}`, { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setIssue(data.issue); setContent(data.issue);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [id]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change(key: keyof NewsletterContent, value: string) { setContent(current => ({ ...current, [key]: value })); setMessage(""); }
  async function save(status: "draft" | "published") {
    if (!issue) return;
    if (status !== issue.status && !window.confirm(status === "published" ? "Publish this saved issue to every signed-in member's archive? No email will be sent." : "Remove this issue from the member archive? Your draft will be kept.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/newsletters/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...content, version: issue.version, status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setIssue(data.issue); setContent(data.issue); setEmailPreview(false);
      setMessage(status === "published" ? "Published to the member archive. No email was sent." : "Draft saved. Only administrators can see it.");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save."); } finally { setBusy(false); }
  }
  async function testSend() {
    if (!issue || dirty || !window.confirm("Send one preview to the configured administrator email address? Subscribers will not be emailed.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/newsletters/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: issue.version }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage(data.message);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not send test."); } finally { setBusy(false); }
  }
  return (
    <main className="min-h-screen bg-[#f3f7f5] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin/newsletters" onClick={event => { if (dirty && !window.confirm("Leave without saving your changes?")) event.preventDefault(); }} className="text-sm text-[#367577] hover:underline">← Newsletter studio</Link>
        <div className="my-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold text-[#173d40]">Edit newsletter</h1><p className="mt-2 text-sm text-slate-500">{issue ? `${issue.status === "published" ? "Published in member archive" : "Private draft"} · ${dirty ? "Unsaved changes" : "All changes saved"}` : "Loading issue…"}</p></div><div className="flex flex-wrap gap-3"><button disabled={busy || !issue} onClick={() => save(issue?.status || "draft")} className="rounded-lg border border-[#367577] bg-white px-4 py-2.5 text-sm font-medium text-[#086b70] disabled:opacity-50">{busy ? "Working…" : "Save changes"}</button>{issue && <button disabled={busy} onClick={() => save(issue.status === "draft" ? "published" : "draft")} className="rounded-lg bg-[#086b70] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{issue.status === "draft" ? "Publish to archive" : "Unpublish"}</button>}</div></div>
        {error && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="mb-5 rounded-lg bg-teal-50 p-4 text-sm text-teal-900">{message}</p>}
        {issue && <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <section className="rounded-2xl border border-[#dce8e5] bg-white p-5 sm:p-6">
            <h2 className="mb-5 text-lg font-semibold text-[#173d40]">Issue details</h2>
            <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
              <label className="block text-sm font-medium text-[#334e4d]">Issue title<input value={content.title} maxLength={140} onChange={event => change("title", event.target.value)} className={fieldClass} /></label>
              <label className="block text-sm font-medium text-[#334e4d]">Email subject<input value={content.subject} maxLength={160} onChange={event => change("subject", event.target.value)} className={fieldClass} /></label>
              <label className="block text-sm font-medium text-[#334e4d]">Short introduction / preview text<input value={content.previewText} maxLength={240} onChange={event => change("previewText", event.target.value)} className={fieldClass} /></label>
              <label className="block text-sm font-medium text-[#334e4d]">Newsletter body<textarea value={content.body} maxLength={20000} rows={14} placeholder="Write your newsletter here. Leave a blank line between paragraphs." onChange={event => change("body", event.target.value)} className={`${fieldClass} resize-y leading-6`} /><span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Plain text, not HTML. {content.body.length.toLocaleString()} / 20,000 characters. Standard Latin text and punctuation are supported in PDF; unsupported emoji are flagged before publication.</span></label>
              <label className="block text-sm font-medium text-[#334e4d]">Optional button label<input value={content.ctaLabel} maxLength={70} placeholder="Explore seasonal recipes" onChange={event => change("ctaLabel", event.target.value)} className={fieldClass} /></label>
              <label className="block text-sm font-medium text-[#334e4d]">Optional button link<input value={content.ctaUrl} maxLength={1500} placeholder="https://www.waistlessfoods.com/recipes" onChange={event => change("ctaUrl", event.target.value)} className={fieldClass} /></label>
            </fieldset>
            {issue.status === "published" && <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Saving changes updates the member-visible issue. Unpublish first if you want to work privately.</p>}
            <div className="mt-6 border-t border-[#dce8e5] pt-5"><h3 className="text-sm font-semibold text-[#173d40]">Review before publishing</h3><p className="mt-2 text-xs leading-5 text-slate-500">Save first. These actions use the saved version, not unsaved edits.</p><div className="mt-4 flex flex-wrap gap-3"><button disabled={busy || dirty} onClick={testSend} className="rounded-lg border border-[#cbdcd6] px-3 py-2 text-sm text-[#086b70] disabled:opacity-40">Send admin test</button><button disabled={dirty || busy} onClick={() => setEmailPreview(value => !value)} className="rounded-lg border border-[#cbdcd6] px-3 py-2 text-sm text-[#086b70] disabled:opacity-40">Email preview</button><a href={`/api/admin/newsletters/${id}?format=pdf`} aria-disabled={dirty || busy} onClick={event => { if (dirty || busy) event.preventDefault(); }} className={`rounded-lg border border-[#cbdcd6] px-3 py-2 text-sm text-[#086b70] ${dirty || busy ? "opacity-40" : ""}`}>Download PDF preview</a></div></div>
          </section>
          <section className="min-w-0"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold uppercase tracking-wider text-[#367577]">{emailPreview ? "Saved email preview" : "Live archive preview"}</h2><span className="text-xs text-slate-500">No broadcast will be sent</span></div>{emailPreview ? <iframe key={issue.version} title="Saved newsletter email preview" sandbox="" src={`/api/admin/newsletters/${id}?format=email`} className="h-[950px] w-full rounded-2xl border border-[#dce8e5] bg-white" /> : <NewsletterArticle issue={content} />}</section>
        </div>}
      </div>
    </main>
  );
}
