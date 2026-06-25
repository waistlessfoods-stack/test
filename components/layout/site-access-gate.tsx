"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STORAGE_KEY = "waistlessfoods-site-unlocked";

type SiteAccessGateProps = {
  children: ReactNode;
};

function isPublicPath(pathname: string): boolean {
  return pathname === "/";
}

export default function SiteAccessGate({ children }: SiteAccessGateProps) {
  const pathname = usePathname();
  const isPublicRoute = isPublicPath(pathname);

  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.sessionStorage.getItem(STORAGE_KEY) === "true";
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const isLocked = !isPublicRoute && !isUnlocked;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid password");
        return;
      }

      window.sessionStorage.setItem(STORAGE_KEY, "true");
      setIsUnlocked(true);
      setPassword("");
    } catch {
      setError("Failed to verify password. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <div
        aria-hidden={isLocked}
        className={isLocked ? "pointer-events-none select-none blur-[2px]" : undefined}
      >
        {children}
      </div>

      <Dialog open={isLocked} onOpenChange={() => undefined}>
        <DialogContent
          className="max-w-sm border-none rounded-2xl p-0 overflow-hidden shadow-2xl [&>button]:hidden"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <div className="h-1.5 bg-[#388082]" />
          <div className="px-8 py-10">
            <DialogHeader className="space-y-2 text-center mb-8">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[#388082]/10 flex items-center justify-center">
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
              <DialogTitle className="text-xl font-semibold text-gray-900 text-center">
                Enter Admin Password
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 text-center">
                Site access is protected. Enter the admin password to continue.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                id="site-access-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Admin password"
                autoFocus
                required
                disabled={isVerifying}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#388082]/40 focus:border-[#388082] transition"
              />

              {error ? <p className="text-sm text-red-500 text-center">{error}</p> : null}

              <button
                type="submit"
                disabled={isVerifying || !password}
                className="w-full py-3 rounded-xl bg-[#388082] text-white text-sm font-medium hover:bg-[#2e6b6d] active:scale-[0.98] transition disabled:opacity-60"
              >
                {isVerifying ? "Verifying..." : "Unlock Site"}
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
