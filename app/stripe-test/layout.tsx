import type { ReactNode } from "react";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Stripe Test",
  "Internal Stripe checkout testing route."
);

export default function StripeTestLayout({ children }: { children: ReactNode }) {
  return children;
}
