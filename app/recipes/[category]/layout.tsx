import type { ReactNode } from "react";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Recipe Category",
  "Legacy recipe category route."
);

export default function RecipeCategoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
