import type { ReactNode } from "react";
import { headers } from "next/headers";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getSocialLinks } from "@/lib/social-links";
import { fetchHeaderSettingsFromContentful } from "@/lib/contentful-management";

export default async function LayoutShell({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isLinksPage = pathname === "/links" || pathname.startsWith("/links/");

  if (isLinksPage) {
    return <>{children}</>;
  }

  const socialLinks = await getSocialLinks();
  const headerSettings = await fetchHeaderSettingsFromContentful();

  return (
    <>
      <Header socialLinks={socialLinks} headerSettings={headerSettings} />
      {children}
      <Footer socialLinks={socialLinks} />
    </>
  );
}
