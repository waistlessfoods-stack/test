import { NextRequest } from "next/server";
import { agreementBody, agreementError, agreementJson, publicAgreementGuard } from "@/lib/service-agreement-http";
import { agreements } from "@/lib/service-workflow-store";

export const maxDuration = 60;
// Tokens are sent only in the request body; not in URLs, server route logs, or
// referrer headers. GET deliberately does not reveal customer agreements.
export async function POST(request: NextRequest) {
  try {
    const denied = await publicAgreementGuard(request); if (denied) return denied;
    const body = await agreementBody(request);
    if (body.action === "review") return agreementJson({ agreement: await agreements.review(body.token) });
    if (body.action === "sign") return agreementJson({ agreement: await agreements.sign(body.token, body.documentHash, body.name, body.consent) });
    return agreementJson({ error: "Unknown agreement action." }, 400);
  } catch (error) { return agreementError(error); }
}
