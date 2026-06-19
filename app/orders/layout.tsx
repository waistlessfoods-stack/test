import type { ReactNode } from "react";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Orders",
  "Private order history page for WaistLess Foods."
);

export default function OrdersLayout({ children }: { children: ReactNode }) {
  return children;
}
