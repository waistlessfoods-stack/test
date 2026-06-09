'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/components/admin/admin-auth';

type Account = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
};

export default function AdminAccountsPage() {
  const { password, logout } = useAdminAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAccounts() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/admin/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          if (response.status === 401) {
            logout();
            return;
          }

          setError(data.error || 'Failed to load accounts');
          return;
        }

        setAccounts(data.accounts || []);
      } catch {
        if (!cancelled) {
          setError('Failed to load accounts');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (password) {
      loadAccounts();
    }

    return () => {
      cancelled = true;
    };
  }, [logout, password]);

  if (loading && accounts.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="rounded-lg bg-white px-6 py-5 shadow">
          <p className="text-sm text-slate-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">User Accounts</h1>
            <p className="text-slate-600 mt-1">
              Total:{' '}
              <span className="font-semibold text-slate-900">
                {accounts.length}
              </span>{' '}
              accounts
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition"
          >
            Logout
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-600">No accounts found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Email Verified
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {account.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {account.email}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            account.emailVerified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {account.emailVerified ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(account.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
