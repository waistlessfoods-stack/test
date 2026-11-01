import { NextRequest } from "next/server";
import { invoiceAdminGuard } from "@/lib/service-invoice-http";
import { agreementBody, agreementError, agreementJson } from "@/lib/service-agreement-http";
import { parseAgreementId } from "@/lib/service-agreement-content";
import { agreements } from "@/lib/service-workflow-store";
import React from "react";
import { sendEmail } from "@/lib/email/mailer";
import ServiceAgreementLinkEmail from "@/lib/email/templates/service-agreement-link-email";
import { businessInquiryEmail } from "@/lib/email/notification-recipients";

type Context = { params: Promise<{ id: string }> };
export const maxDuration = 60;
export async function GET(request: NextRequest, context: Context) {
  const denied = invoiceAdminGuard(request); if (denied) return denied;
  try { return agreementJson({ agreement: await agreements.read(parseAgreementId((await context.params).id)) }); }
  catch (error) { return agreementError(error); }
}
export async function PATCH(request: NextRequest, context: Context) {
  const denied = invoiceAdminGuard(request); if (denied) return denied;
  try {
    const body = await agreementBody(request);
    return agreementJson({ agreement: await agreements.save(parseAgreementId((await context.params).id), body.version, body.content) });
  } catch (error) { return agreementError(error); }
}
export async function POST(request: NextRequest, context: Context) {
  const denied = invoiceAdminGuard(request); if (denied) return denied;
  try {
    const id = parseAgreementId((await context.params).id);
    const body = await agreementBody(request);
    if (body.action === "void") return agreementJson({ agreement: await agreements.voidAgreement(id, body.version) });
    if (body.action === "email") {
      const agreement = await agreements.signingCopy(id, body.token);
      const url = `${new URL(request.url).origin}/agreements/sign#${body.token}`;
      const result = await sendEmail({ to: agreement.content.email, replyTo: businessInquiryEmail, subject: `Review your agreement — ${agreement.content.title}`, react: React.createElement(ServiceAgreementLinkEmail, { name: agreement.content.name, title: agreement.content.title, url }) });
      if (result.error) return agreementJson({ error: "The signing link could not be confirmed sent. Check the recipient's inbox before sending it again; you can also share the private link directly." }, 502);
      return agreementJson({ message: "The mail server accepted the signing email. Inbox delivery is not confirmed." });
    }
    if (body.action !== "issue" && body.action !== "renew_link") return agreementJson({ error: "Unknown agreement action." }, 400);
    const result = body.action === "issue" ? await agreements.issue(id, body.version, body.reviewed) : await agreements.renewLink(id, body.version);
    return agreementJson({ agreement: result.agreement, signingUrl: `${new URL(request.url).origin}/agreements/sign#${result.token}` });
  } catch (error) { return agreementError(error); }
}
