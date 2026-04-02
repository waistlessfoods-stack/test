'use client';

import { useState } from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    description: 'Statistics, recent orders, accounts, and enquiries',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/admin/accounts',
    label: 'All Accounts',
    description: 'Complete list of registered user accounts',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/admin/bookings',
    label: 'Booking Requests',
    description: 'View and manage all service booking requests',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    description: 'Manage tax rate and storefront configuration',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Invalid password');
        return;
      }
      setAuthenticated(true);
    } catch {
      setError('Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#f0f5f5] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="h-1.5 bg-[#388082]" />
            <div className="px-8 py-10">
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#388082]/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-[#388082]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-center text-xl font-semibold text-gray-900 mb-1">Admin Portal</h1>
              <p className="text-center text-sm text-gray-500 mb-8">Enter your admin password to continue</p>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  autoFocus
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#388082]/40 focus:border-[#388082] transition"
                />
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full py-3 rounded-xl bg-[#388082] text-white text-sm font-medium hover:bg-[#2e6b6d] active:scale-[0.98] transition disabled:opacity-60"
                >
                  {loading ? 'Verifying…' : 'Access Dashboard'}
                </button>
              </form>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">WaitsLess Foods · Admin Portal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f5f5]">
      {/* Header */}
      <header className="bg-[#388082] text-white">
        <div className="container mx-auto px-4 md:px-12 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Admin Portal</h1>
              <p className="text-xs text-white/60">WaitsLess Foods Management</p>
            </div>
          </div>
          <button
            onClick={() => { setAuthenticated(false); setPassword(''); }}
            className="text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Nav cards */}
      <div className="container mx-auto px-4 md:px-12 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="group bg-white rounded-2xl shadow-sm border border-transparent hover:border-[#388082]/20 hover:shadow-md transition-all p-6 cursor-pointer h-full">
                <div className="w-10 h-10 rounded-xl bg-[#388082]/10 text-[#388082] flex items-center justify-center mb-4 group-hover:bg-[#388082] group-hover:text-white transition-all">
                  {item.icon}
                </div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1">{item.label}</h2>
                <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#388082] group-hover:gap-2 transition-all">
                  Open
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}

        </div>
      </div>
    </div>
  );
}
