import type { ReactNode } from "react";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Sign Up",
  "Customer account registration page for WaistLess Foods."
);

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return children;
}
