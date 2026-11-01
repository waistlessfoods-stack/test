"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/admin", "Admin portal"],
  ["/admin/dashboard", "Dashboard"],
  ["/admin/bookings", "Booking requests"],
  ["/admin/class-rosters", "Class registrations"],
  ["/admin/service-invoices", "Service invoices"],
  ["/admin/service-agreements", "Agreements"],
  ["/admin/newsletters", "Newsletters"],
  ["/admin/recipes", "Recipe management"],
  ["/admin/services", "Service photos"],
  ["/admin/reviews", "Reviews"],
  ["/admin/accounts", "Accounts"],
  ["/admin/settings", "Settings"],
  ["/admin/walkthrough", "Walkthrough guide"],
];

export default function AdminNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin tools" className="border-b border-[#d5e3df] bg-[#173d40] text-white print:hidden">
      <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-4 py-2 sm:px-8">
        {links.map(([href, label]) => {
          const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active ? "bg-white text-[#173d40]" : "text-white/85 hover:bg-white/10"}`}>{label}</Link>;
        })}
      </div>
    </nav>
  );
}
