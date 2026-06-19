import type { ReactNode } from "react";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Account",
  "Private customer account page for WaistLess Foods."
);

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
