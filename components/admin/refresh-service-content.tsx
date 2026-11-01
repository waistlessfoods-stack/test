"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RefreshServiceContent() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  async function refresh() {
    setBusy(true); setMessage(''); setError(false);
    try {
      const response = await fetch('/api/admin/services/refresh', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not refresh service content.');
      router.refresh(); setMessage(data.message);
    } catch (error) { setError(true); setMessage(error instanceof Error ? error.message : 'Could not refresh service content.'); }
    finally { setBusy(false); }
  }
  return <div><button type="button" disabled={busy} onClick={() => void refresh()} className="rounded-lg border border-[#388082] bg-white px-4 py-2 text-sm font-medium text-[#086b70] disabled:opacity-50">{busy ? 'Refreshing…' : 'Refresh published services'}</button>{message && <p role={error ? 'alert' : 'status'} className={`mt-2 text-sm ${error ? 'text-red-700' : 'text-[#086b70]'}`}>{message}</p>}</div>;
}
