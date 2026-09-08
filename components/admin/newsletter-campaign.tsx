"use client";

import { useEffect, useRef, useState } from 'react';
import { Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import type { Campaign } from '@/lib/newsletter-campaigns';
import { NEWSLETTER_ADDRESS_PLACEHOLDER } from '@/lib/newsletter-address';

type State = { campaign: Campaign | null; counts: Record<string, number>; recent: { id: number; email: string; status: string }[]; settings: { enabled: boolean; addressConfigured: boolean; dailyLimit: number }; message?: string; attempted?: boolean };
const button = 'min-h-11 rounded-lg border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800 disabled:opacity-40';

export default function NewsletterCampaign({ id, version, dirty }: { id: string; version: number; dirty: boolean }) {
  const [data, setData] = useState<State | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const stop = useRef(false);
  const mounted = useRef(true);
  const endpoint = `/api/admin/newsletters/${id}/campaign`;
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    fetch(endpoint, { signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (!controller.signal.aborted) setData(result);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => { controller.abort(); mounted.current = false; stop.current = true; };
  }, [endpoint]);
  async function request(action?: string): Promise<State> {
    const response = await fetch(endpoint, action ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, version, confirm: action === 'send' ? 'SEND' : undefined }) } : undefined);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Campaign request failed. Refresh before retrying.');
    if (mounted.current) { setData(result); setMessage(result.message || 'Progress refreshed.'); }
    return result;
  }
  async function act(action?: string) {
    if (action === 'prepare' && !window.confirm('Freeze the saved newsletter and current active subscriber list? No email is sent yet. Each issue supports one campaign; its content cannot be changed afterward.')) return;
    if (action === 'cancel' && !window.confirm('Permanently cancel all pending recipients? Emails already sent or in flight cannot be recalled.')) return;
    if (action === 'resume' && !window.confirm('Review uncertain sends in Gmail first. Resume only recipients never attempted? Uncertain recipients will NOT be retried.')) return;
    setBusy(true); setError('');
    try { await request(action); } catch (error) { setError(error instanceof Error ? error.message : 'Request failed.'); }
    finally { setBusy(false); }
  }
  async function sendBatch() {
    if (!data?.campaign || !window.confirm(`Send the frozen campaign “${data.campaign.snapshot.subject}” to up to 5 pending subscribers now? These are REAL emails, not previews.`)) return;
    stop.current = false; setBusy(true); setError('');
    try {
      for (let index = 0; index < 5 && !stop.current; index++) {
        const result = await request('send');
        if (!result.attempted || result.campaign?.status !== 'ready' || !(result.counts.pending > 0)) break;
        if (index < 4) await new Promise(resolve => setTimeout(resolve, 10_500));
      }
    } catch (error) {
      if (mounted.current) setError(error instanceof Error ? `${error.message} No automatic retry was made. Refresh to check progress.` : 'Request failed. Refresh to check progress.');
    } finally { if (mounted.current) setBusy(false); }
  }
  const campaign = data?.campaign;
  return <section aria-labelledby="campaign-heading" className="mt-7 rounded-2xl border border-[#dce8e5] bg-white p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700"><Mail size={16} /> Gmail campaigns</p><h2 id="campaign-heading" className="mt-2 text-xl font-semibold text-[#173d40]">Send to subscribers</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Archive publication does not send emails. Prepare a frozen copy, review it, then explicitly send a small batch.</p></div><button disabled={busy} onClick={() => act()} className={button}><RefreshCw size={14} className="mr-2 inline" />Refresh progress</button></div>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-lg bg-teal-50 p-4 text-sm text-teal-900">{message}</p>}
    {data && <>
      <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-950">{data.settings.enabled ? `Newsletter cap: ${data.settings.dailyLimit} attempted emails per rolling 24 hours, across all campaigns.` : 'Subscriber sending is disabled. You can still edit, preview, and send administrator-only tests.'} {!data.settings.addressConfigured && <> The preview footer uses: <strong>{NEWSLETTER_ADDRESS_PLACEHOLDER}</strong>. Replace it later using NEWSLETTER_MAILING_ADDRESS before preparing a real subscriber campaign.</>} Google mailbox limits also apply to order emails and ordinary mail; this cap cannot guarantee spare quota.</p>
      {!campaign ? <div className="mt-5"><button disabled={busy || dirty || !data.settings.addressConfigured} onClick={() => act('prepare')} className={button}>Prepare saved issue & audience</button><p className="mt-2 text-xs leading-5 text-slate-500">{dirty ? 'Save your edits first. ' : ''}Only active subscribers are included—not customers or members who have not subscribed.</p></div> : <>
        <div className="mt-5 flex flex-wrap items-center gap-3"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">{campaign.status}</span><span className="text-sm text-slate-500">Frozen version {campaign.issue_version} · One campaign per issue</span></div>
        {campaign.issue_version !== version && <p className="mt-3 text-sm text-amber-900">The editor has a newer version. This campaign still sends the frozen content below.</p>}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{[['pending', 'Pending'], ['accepted', 'Accepted by Google'], ['uncertain', 'Needs review'], ['skipped', 'Skipped'], ['sending', 'In flight']].map(([key, label]) => <div key={key} className="rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-[#173d40]">{data.counts[key] || 0}</p></div>)}</div>
        <details className="mt-5 rounded-lg border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold text-teal-800">Review frozen email content & footer</summary><div className="mt-4 space-y-3 break-words text-sm text-slate-700"><p><strong>Subject:</strong> {campaign.snapshot.subject}</p><h3 className="text-lg font-semibold">{campaign.snapshot.title}</h3><p>{campaign.snapshot.previewText}</p><p className="whitespace-pre-wrap leading-7">{campaign.snapshot.body}</p>{campaign.snapshot.ctaUrl && <p>{campaign.snapshot.ctaLabel}: {campaign.snapshot.ctaUrl}</p>}<p className="border-t pt-3">{campaign.mailing_address}<br />Each subscriber receives their own unsubscribe link.</p></div></details>
        {!!data.recent.length && <div className="mt-4 rounded-lg bg-amber-50 p-4"><h3 className="text-sm font-semibold text-amber-950">Review in Gmail before continuing</h3><ul className="mt-2 space-y-2 text-sm text-amber-950">{data.recent.map(row => <li key={row.id} className="break-all">{row.email} — {row.status}</li>)}</ul><p className="mt-2 text-xs">Up to 20 recent in-flight/uncertain recipients. They are never automatically retried.</p></div>}
        <div className="mt-5 flex flex-wrap gap-3"><button disabled={busy || !data.settings.enabled || campaign.status !== 'ready' || !(data.counts.pending > 0)} onClick={sendBatch} className={`${button} bg-teal-800 !text-white`}>{busy ? 'Working…' : 'Send next 5 subscribers'}</button>{busy && <button onClick={() => { stop.current = true; setMessage('Stopping after the current request. Any in-flight email may still be sent.'); }} className={button}>Stop after current email</button>}{(campaign.status === 'paused' || !!data.counts.sending) && <button disabled={busy} onClick={() => act('resume')} className={button}>Review complete · resume pending</button>}{['ready', 'paused'].includes(campaign.status) && <button disabled={busy} onClick={() => act('cancel')} className={button}>Cancel remaining</button>}</div>
      </>}
      <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-slate-500"><ShieldCheck size={17} className="mt-1 shrink-0" />Each recipient is checked again for opt-out before sending. Keep this page open for the current batch; closing it stops further requests but cannot recall an in-flight email. No unattended scheduling, inbox-delivery tracking, or automatic bounce processing is enabled.</p>
    </>}
  </section>;
}
