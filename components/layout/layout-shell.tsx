import type { ReactNode } from "react";
import { headers } from "next/headers";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getSocialLinks } from "@/lib/social-links";

export default async function LayoutShell({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isLinksPage = pathname === "/links" || pathname.startsWith("/links/");

  if (isLinksPage) {
    return <>{children}</>;
  }

  const socialLinks = await getSocialLinks();

  return (
    <>
      <Header socialLinks={socialLinks} />
      {children}
      <Footer socialLinks={socialLinks} />
    </>
  );
}
