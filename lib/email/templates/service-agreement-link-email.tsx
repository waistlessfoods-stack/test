import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export default function ServiceAgreementLinkEmail({ name, title, url }: { name: string; title: string; url: string }) {
  return <Html><Head /><Preview>Review your WaistLess Foods agreement</Preview><Body style={{ backgroundColor: "#f3f7f5", fontFamily: "Arial, sans-serif", padding: "32px 12px", color: "#173d40" }}><Container style={{ backgroundColor: "#fff", padding: "32px", maxWidth: "600px" }}>
    <Text>WaistLess Foods · Chef Amber</Text><Heading>{title}</Heading><Text>Hello {name},</Text>
    <Text>Chef Amber has prepared your agreement. Please review the event details and terms, then sign electronically if everything is correct.</Text>
    <Button href={url} style={{ backgroundColor: "#086b70", color: "white", padding: "14px 20px", borderRadius: "8px" }}>Review and sign agreement</Button>
    <Text>This private link expires in 30 days. Keep it private. Signing does not charge your card; an invoice will be sent separately.</Text>
    <Text>If anything needs changing, reply to this email before signing.</Text>
  </Container></Body></Html>;
}
