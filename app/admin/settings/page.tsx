"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth";

export default function AdminSettingsPage() {
  const { authenticated, logout } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [taxPercent, setTaxPercent] = useState("8.25");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const response = await fetch("/api/admin/settings", {
          method: "POST",
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

          setError(data.error || "Failed to load settings");
          return;
        }

        const percent = Number(data.taxRate) * 100;
        setTaxPercent(Number.isFinite(percent) ? percent.toFixed(2) : "8.25");
      } catch {
        if (!cancelled) {
          setError("Failed to load settings");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (authenticated) {
      loadSettings();
    }

    return () => {
      cancelled = true;
    };
  }, [authenticated, logout]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxRate: taxPercent,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }

        setError(data.error || "Failed to save settings");
        return;
      }

      const percent = Number(data.taxRate) * 100;
      setTaxPercent(Number.isFinite(percent) ? percent.toFixed(2) : taxPercent);
      setSuccess("Tax rate updated successfully.");
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f5f5] flex items-center justify-center p-4">
        <div className="rounded-2xl bg-white px-6 py-5 shadow-lg">
          <p className="text-sm text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f5f5]">
      <header className="bg-[#388082] text-white">
        <div className="container mx-auto px-4 md:px-12 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold leading-tight">Settings</h1>
            <p className="text-xs text-white/60">Storefront pricing configuration</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin"
              className="text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition"
            >
              Dashboard
            </a>
            <button
              onClick={logout}
              className="text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-12 py-8">
        <div className="max-w-xl rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Tax Configuration</h2>
          <p className="mt-1 text-sm text-gray-500">
            Set the default sales tax used in cart totals and Stripe checkout.
          </p>

          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="taxRate">
                Sales tax rate (%)
              </label>
              <input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#388082]/40 focus:border-[#388082]"
              />
              <p className="mt-2 text-xs text-gray-500">
                Example: enter 8.25 for 8.25% tax.
              </p>
            </div>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            {success ? <p className="text-sm text-green-600">{success}</p> : null}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-[#388082] py-3 text-sm font-medium text-white hover:bg-[#2e6b6d] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Tax Rate"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
