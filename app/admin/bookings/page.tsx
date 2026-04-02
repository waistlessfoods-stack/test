"use client";

import { useState } from "react";

type Booking = {
  id: number;
  serviceSlug: string;
  serviceTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  guests: number;
  preferredDate: string;
  alternativeDate: string | null;
  notes: string;
  status: string;
  createdAt: string;
};

type FilterTab = "all" | "pending" | "confirmed" | "cancelled";

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; border: string; badge: string }
> = {
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    border: "border-l-amber-400",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    dot: "bg-emerald-500",
    border: "border-l-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-red-400",
    border: "border-l-red-400",
    badge: "bg-red-50 text-red-600 ring-red-200",
  },
};

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function AdminBookingsPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [fadingOut, setFadingOut] = useState<Set<number>>(new Set());

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setAuthError(data.error ?? "Incorrect password");
        return;
      }
      const data = await res.json();
      setBookings(data.bookings ?? []);
      setAuthed(true);
    } catch {
      setAuthError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(bookingId: number, status: string) {
    setUpdatingId(bookingId);
    // If the card will leave the current filtered view, animate it out first
    const willLeave = filter !== "all" && status !== filter;
    if (willLeave) {
      setFadingOut((prev) => new Set(prev).add(bookingId));
    }
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, bookingId, status }),
      });
      if (res.ok) {
        if (willLeave) {
          // Let the exit animation play before updating state
          setTimeout(() => {
            setBookings((prev) =>
              prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
            );
            setFadingOut((prev) => {
              const next = new Set(prev);
              next.delete(bookingId);
              return next;
            });
          }, 300);
        } else {
          setBookings((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
          );
        }
      } else {
        // Revert animation if request failed
        setFadingOut((prev) => {
          const next = new Set(prev);
          next.delete(bookingId);
          return next;
        });
      }
    } finally {
      setUpdatingId(null);
    }
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  // ── Login screen ───────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#f0f5f5] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="h-1.5 bg-[#388082]" />
            <div className="px-8 py-10">
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#388082]/10 flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-[#388082]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-center text-xl font-semibold text-gray-900 mb-1">
                Booking Requests
              </h1>
              <p className="text-center text-sm text-gray-500 mb-8">
                Enter your admin password to continue
              </p>
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="password"
                  placeholder="Admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#388082]/40 focus:border-[#388082] transition"
                />
                {authError && (
                  <p className="text-sm text-red-500 text-center">{authError}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#388082] text-white text-sm font-medium hover:bg-[#2e6b6d] active:scale-[0.98] transition disabled:opacity-60"
                >
                  {loading ? "Verifying…" : "Access Dashboard"}
                </button>
              </form>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            WaitsLess Foods · Admin Portal
          </p>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f0f5f5]">
      {/* Header */}
      <header className="bg-[#388082] text-white">
        <div className="container mx-auto px-4 md:px-12 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">
                Booking Requests
              </h1>
              <p className="text-xs text-white/60">
                {counts.all} {counts.all === 1 ? "request" : "requests"} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Dashboard
            </a>
            <button
              onClick={() => {
                setAuthed(false);
                setPassword("");
                setBookings([]);
              }}
              className="text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-12 py-8 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["all", "pending", "confirmed", "cancelled"] as FilterTab[]).map(
            (tab) => {
              const isActive = filter === tab;
              const cfg = tab === "all" ? null : STATUS_CONFIG[tab] ?? null;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`rounded-2xl p-4 text-left transition-all border ${
                    isActive
                      ? "bg-[#388082] border-[#388082] text-white shadow-md shadow-[#388082]/20"
                      : "bg-white border-transparent text-gray-800 hover:border-gray-200 shadow-sm"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold tracking-tight ${isActive ? "text-white" : "text-gray-900"}`}
                  >
                    {counts[tab]}
                  </div>
                  <div
                    className={`flex items-center gap-1.5 mt-0.5 text-xs font-medium capitalize ${isActive ? "text-white/80" : "text-gray-500"}`}
                  >
                    {cfg && !isActive && (
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                    )}
                    {tab}
                  </div>
                </button>
              );
            }
          )}
        </div>

        {/* Booking list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500">
              No {filter === "all" ? "" : filter} bookings yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking) => {
              const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
              const isOpen = expanded.has(booking.id);
              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-2xl shadow-sm border-l-4 ${cfg.border} overflow-hidden transition-all duration-300 ${fadingOut.has(booking.id) ? "opacity-0 scale-95 -translate-y-1" : "opacity-100 scale-100"}`}
                >
                  {/* Card header row */}
                  <div className="px-5 py-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#388082]/10 text-[#388082] flex items-center justify-center text-sm font-semibold tracking-tight shrink-0">
                      {initials(booking.firstName, booking.lastName)}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">
                          {booking.firstName} {booking.lastName}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ring-1 ${cfg.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {booking.serviceTitle} · {booking.guests} guest
                        {booking.guests !== 1 ? "s" : ""} ·{" "}
                        {booking.preferredDate} · Submitted{" "}
                        {formatDate(booking.createdAt)}
                      </p>
                    </div>

                    {/* Status selector + expand */}
                    <div className="shrink-0 flex items-center gap-2">
                      <select
                        value={booking.status}
                        disabled={updatingId === booking.id}
                        onChange={(e) => updateStatus(booking.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#388082]/30 focus:border-[#388082] disabled:opacity-50 cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <button
                        onClick={() => toggleExpand(booking.id)}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
                        aria-label={isOpen ? "Collapse" : "Expand"}
                      >
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1">
                      <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <DetailRow
                          label="Email"
                          value={
                            <a
                              href={`mailto:${booking.email}`}
                              className="text-[#388082] underline underline-offset-2 hover:text-[#2e6b6d]"
                            >
                              {booking.email}
                            </a>
                          }
                        />
                        <DetailRow label="Phone" value={booking.phone} />
                        <DetailRow
                          label="Guests"
                          value={`${booking.guests} ${booking.guests === 1 ? "person" : "people"}`}
                        />
                        <DetailRow
                          label="Preferred Date"
                          value={booking.preferredDate}
                        />
                        <DetailRow
                          label="Alternative Date"
                          value={booking.alternativeDate ?? "—"}
                        />
                        {booking.notes && (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                              Notes
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                              {booking.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-gray-800">{value}</p>
    </div>
  );
}
