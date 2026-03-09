import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Font,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  name: string;
  resetLink: string;
}

export default function PasswordResetEmail({
  name,
  resetLink,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Metropolis"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Metropolis:wght@400;700",
            format: "woff2",
          }}
        />
      </Head>
      <Preview>Password Reset Request</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Password Reset Request</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {name},</Text>
            <Text style={paragraph}>
              We received a request to reset your password. Click the button below to create
              a new password.
            </Text>

            <Section style={cta}>
              <Button style={button} href={resetLink}>
                Reset Password
              </Button>
            </Section>

            <Text style={copyLink}>
              Or copy this link:{" "}
              <Link href={resetLink} style={link}>
                {resetLink}
              </Link>
            </Text>

            <Section style={warningBox}>
              <Text style={warningText}>
                <strong>⚠️ Security Note:</strong> This link expires in 24 hours. If you
                didn't request this, please ignore this email or contact support.
              </Text>
            </Section>

            <Text style={paragraph}>
              For security reasons, we'll never ask for your password via email.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              © 2026 Waistless Foods. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href="https://waitslessfood.com" style={link}>
                Visit our website
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const header = {
  backgroundColor: "#0F8DAB",
  borderRadius: "4px",
  margin: "0 0 20px 0",
  padding: "20px 20px",
  textAlign: "center" as const,
};

const headerTitle = {
  color: "#fff",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0",
  padding: "0",
};

const content = {
  padding: "0 20px",
};

const paragraph = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "1.6",
  textAlign: "left" as const,
  margin: "16px 0",
};

const cta = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#0F8DAB",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 30px",
};

const copyLink = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "16px 0",
  wordBreak: "break-all" as const,
};

const warningBox = {
  backgroundColor: "#fff3cd",
  borderRadius: "4px",
  padding: "16px",
  margin: "24px 0",
};

const warningText = {
  color: "#856404",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "32px 0",
};

const footer = {
  padding: "0 20px",
};

const footerText = {
  color: "#666",
  fontSize: "12px",
  lineHeight: "1.5",
  textAlign: "center" as const,
  margin: "8px 0",
};

const link = {
  color: "#0F8DAB",
  textDecoration: "underline",
};
