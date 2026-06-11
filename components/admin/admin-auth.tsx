"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type AdminAuthContextValue = {
  authenticated: boolean;
  isChecking: boolean;
  isSubmitting: boolean;
  error: string;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

async function getAdminSessionStatus() {
  const response = await fetch("/api/admin/verify", {
    method: "GET",
  });

  let data: { authenticated?: boolean; error?: string } = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  return {
    ok: response.ok && data.authenticated === true,
    error: data.error ?? "Admin session required",
  };
}

async function createAdminSession(password: string) {
  const response = await fetch("/api/admin/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  let data: { error?: string } = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  return { ok: response.ok, error: data.error ?? "Invalid password" };
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const result = await getAdminSessionStatus();

      if (cancelled) {
        return;
      }

      if (result.ok) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }

      setError("");
      setIsChecking(false);
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(nextPassword: string) {
    setIsSubmitting(true);
    setError("");

    try {
      const result = await createAdminSession(nextPassword);

      if (!result.ok) {
        setAuthenticated(false);
        setError(result.error);
        return false;
      }

      setAuthenticated(true);
      setError("");
      return true;
    } catch {
      setError("Failed to authenticate");
      return false;
    } finally {
      setIsSubmitting(false);
      setIsChecking(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Local state still needs to clear even if the network request fails.
    }

    setAuthenticated(false);
    setError("");
  }

  return (
    <AdminAuthContext.Provider
      value={{
        authenticated,
        isChecking,
        isSubmitting,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }

  return context;
}

export function AdminAccessGate({ children }: { children: ReactNode }) {
  const { authenticated, isChecking, isSubmitting, error, login } =
    useAdminAuth();
  const [passwordInput, setPasswordInput] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const success = await login(passwordInput);

    if (success) {
      setPasswordInput("");
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#f0f5f5] flex items-center justify-center p-4">
        <div className="rounded-2xl bg-white px-6 py-5 shadow-lg">
          <p className="text-sm text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-center text-xl font-semibold text-gray-900 mb-1">
                Admin Portal
              </h1>
              <p className="text-center text-sm text-gray-500 mb-8">
                Enter your admin password to continue
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                  placeholder="Admin password"
                  autoFocus
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#388082]/40 focus:border-[#388082] transition"
                />
                {error ? (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={isSubmitting || !passwordInput}
                  className="w-full py-3 rounded-xl bg-[#388082] text-white text-sm font-medium hover:bg-[#2e6b6d] active:scale-[0.98] transition disabled:opacity-60"
                >
                  {isSubmitting ? "Verifying..." : "Access Admin"}
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

  return <>{children}</>;
}
