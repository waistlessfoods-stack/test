import type { ReactNode } from "react";
import { AuthenticationSettingsProvider } from "@/components/auth/auth-image-provider";
import { fetchAuthenticationSettingsFromContentful } from "@/lib/contentful-management";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Sign Up",
  "Customer account registration page for WaistLess Foods."
);

export default async function SignUpLayout({ children }: { children: ReactNode }) {
  const settings = await fetchAuthenticationSettingsFromContentful();

  return (
    <AuthenticationSettingsProvider settings={settings}>
      {children}
    </AuthenticationSettingsProvider>
  );
}
