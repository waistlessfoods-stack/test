import "server-only";
import React from "react";
import { Body, Container, Head, Heading, Html, Link, Text } from "@react-email/components";
import { sendEmail } from "@/lib/email/mailer";
import { businessInquiryEmail } from "@/lib/email/notification-recipients";
import { serviceMoney, type ServiceInvoiceView } from "@/lib/service-invoice-content";

export function ServiceInvoicePaymentEmail({ invoice }: { invoice: ServiceInvoiceView }) {
  return <Html><Head /><Body style={{ fontFamily: "Arial, sans-serif", color: "#173d40", padding: "24px", backgroundColor: "#f3f7f5" }}><Container style={{ backgroundColor: "white", padding: "28px" }}>
    {!invoice.live && <Text style={{ fontWeight: "bold", color: "#854d0e" }}>TEST PAYMENT — No real money. Do not fulfill.</Text>}
    <Heading>Service invoice marked paid</Heading><Text>{invoice.title}</Text><Text>{invoice.name} · {invoice.email}</Text>
    <Text>Invoice: {invoice.number || invoice.id}<br />Paid: {serviceMoney(invoice.paid, invoice.currency)}<br />Remaining: {serviceMoney(invoice.remaining, invoice.currency)}</Text>
    {invoice.bookingId && <Text>Booking request #{invoice.bookingId}</Text>}
    <Link href="https://www.waistlessfoods.com/admin/service-invoices">Open service invoices</Link>
    <Text>Payment status is reported by Stripe. Review the signed agreement and event requirements before confirming fulfillment.</Text>
  </Container></Body></Html>;
}
export async function sendServiceInvoicePayment(invoice: ServiceInvoiceView): Promise<void> {
  const result = await sendEmail({ to: businessInquiryEmail, replyTo: invoice.email, subject: `${invoice.live ? "" : "[TEST] "}Service invoice paid — ${invoice.number || invoice.id}`, react: React.createElement(ServiceInvoicePaymentEmail, { invoice }) });
  if (result.error) throw new Error("Service invoice payment notification could not be confirmed sent.");
}
