"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLinksPage = pathname === "/links" || pathname.startsWith("/links/");

  if (isLinksPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
