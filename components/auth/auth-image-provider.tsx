"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AuthenticationSettings } from "@/lib/contentful-management";

const AuthenticationSettingsContext =
  createContext<AuthenticationSettings | null>(null);

export function AuthenticationSettingsProvider({
  children,
  settings,
}: {
  children: ReactNode;
  settings: AuthenticationSettings | null;
}) {
  return (
    <AuthenticationSettingsContext.Provider value={settings}>
      {children}
    </AuthenticationSettingsContext.Provider>
  );
}

export function useAuthenticationSettings() {
  return useContext(AuthenticationSettingsContext);
}
