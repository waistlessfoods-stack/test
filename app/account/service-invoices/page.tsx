import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MemberServiceInvoices from "@/components/member-service-invoices";

export const metadata = { title: "Your service invoices | WaistLess Foods", robots: { index: false, follow: false } };
export default async function Page() {
  if (!(await auth()).userId) redirect("/signin?redirect_url=%2Faccount%2Fservice-invoices");
  return <MemberServiceInvoices />;
}
