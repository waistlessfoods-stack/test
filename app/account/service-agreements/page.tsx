import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MemberServiceAgreements from "@/components/member-service-agreements";

export const metadata = { title: "Your agreements | WaistLess Foods", robots: { index: false, follow: false } };
export default async function Page() {
  if (!(await auth()).userId) redirect("/signin?redirect_url=%2Faccount%2Fservice-agreements");
  return <MemberServiceAgreements />;
}
