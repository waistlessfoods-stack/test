import type { ReactNode } from "react";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "SSO Callback",
  "Authentication callback route."
);

export default function SsoCallbackLayout({ children }: { children: ReactNode }) {
  return children;
}
