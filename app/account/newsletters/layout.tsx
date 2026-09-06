import type { ReactNode } from "react";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata("The WaistLess Table — Member Archive", "Private newsletter archive for WaistLess Foods members.");

export default function NewsletterArchiveLayout({ children }: { children: ReactNode }) { return children; }
