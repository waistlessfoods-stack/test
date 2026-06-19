import type { ReactNode } from "react";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Sign In",
  "Customer sign-in page for WaistLess Foods."
);

export default function SignInLayout({ children }: { children: ReactNode }) {
  return children;
}
