'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalAccounts: number;
  totalOrders: number;
  totalRevenue: number;
  totalEnquiries: number;
  totalSubscribers: number;
  recentAccounts: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
  recentOrders: Array<{
    id: number;
    userId: string;
    amount: number;
    status: string;
    createdAt: string;
    customerEmail: string;
  }>;
  recentEnquiries: Array<{
    id: number;
    name: string;
    email: string;
    type: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid password');
        setLoading(false);
        return;
      }

      setAuthenticated(true);
      setStats(data.stats);
    } catch (err) {
      setError('Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600 mb-6">Enter password to continue</p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Admin Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Checking...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-slate-600 mt-1">Welcome back</p>
            </div>
            <button
              onClick={() => {
                setAuthenticated(false);
                setPassword('');
                setStats(null);
              }}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {stats ? (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Accounts */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Accounts</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {stats.totalAccounts}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m4-8V4m0 16v-2m0 0a4 4 0 110-5.292M9 12h6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Orders</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {stats.totalOrders}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      ${(stats.totalRevenue / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Enquiries */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Enquiries</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {stats.totalEnquiries}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Subscribers */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Subscribers</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {stats.totalSubscribers}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Accounts */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">Recent Accounts</h2>
                </div>
                <div className="divide-y divide-slate-200">
                  {stats.recentAccounts.length === 0 ? (
                    <div className="px-6 py-8 text-center text-slate-600">No accounts yet</div>
                  ) : (
                    stats.recentAccounts.map((account) => (
                      <div key={account.id} className="px-6 py-4 hover:bg-slate-50 transition">
                        <p className="font-medium text-slate-900">{account.name}</p>
                        <p className="text-sm text-slate-600">{account.email}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(account.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
                </div>
                <div className="divide-y divide-slate-200">
                  {stats.recentOrders.length === 0 ? (
                    <div className="px-6 py-8 text-center text-slate-600">No orders yet</div>
                  ) : (
                    stats.recentOrders.map((order) => (
                      <div key={order.id} className="px-6 py-4 hover:bg-slate-50 transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-900">${(order.amount / 100).toFixed(2)}</p>
                            <p className="text-sm text-slate-600">{order.customerEmail}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              order.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recent Enquiries */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Recent Enquiries</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {stats.recentEnquiries.length === 0 ? (
                  <div className="px-6 py-8 text-center text-slate-600">No enquiries yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-slate-900">Name</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-900">Email</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-900">Type</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-900">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentEnquiries.map((enquiry) => (
                          <tr key={enquiry.id} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-3 text-slate-900">{enquiry.name}</td>
                            <td className="px-6 py-3 text-slate-600">{enquiry.email}</td>
                            <td className="px-6 py-3">
                              <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-700">
                                {enquiry.type}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-slate-600">
                              {new Date(enquiry.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-8">
            <p className="text-slate-600">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}
