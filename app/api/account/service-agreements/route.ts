import { currentUser } from "@clerk/nextjs/server";
import { agreementError, agreementJson } from "@/lib/service-agreement-http";
import { agreements } from "@/lib/service-workflow-store";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return agreementJson({ error: "Sign in to view your agreements." }, 401);
    const primary = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId);
    if (!primary || primary.verification?.status !== "verified") return agreementJson({ error: "Verify your primary email to view agreements." }, 403);
    return agreementJson({ agreements: await agreements.memberList(primary.emailAddress.trim().toLowerCase()) });
  } catch (error) { return agreementError(error); }
}
