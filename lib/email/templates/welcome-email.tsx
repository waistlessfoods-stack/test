import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Font,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
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
      <Preview>Welcome to Waistless Foods!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Welcome to Waistless Foods!</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {name},</Text>
            <Text style={paragraph}>
              We're thrilled to have you join our food community! Your account has been
              successfully created.
            </Text>

            <Heading as="h2" style={sectionTitle}>
              What's Next?
            </Heading>
            <ul style={listStyle}>
              <li style={listItem}>🥘 Explore our recipe gallery</li>
              <li style={listItem}>💳 Purchase premium recipes</li>
              <li style={listItem}>🎯 Get personalized recommendations</li>
              <li style={listItem}>📦 Track your orders</li>
            </ul>

            <Section style={cta}>
              <Button style={button} href="https://waitslessfood.com/recipes">
                Browse Recipes
              </Button>
            </Section>

            <Text style={paragraph}>
              If you have any questions or need help, our support team is here for you.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>© 2026 Waistless Foods. All rights reserved.</Text>
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

const sectionTitle = {
  color: "#0F8DAB",
  fontSize: "20px",
  fontWeight: "700",
  margin: "24px 0 16px 0",
};

const listStyle = {
  margin: "16px 0",
  paddingLeft: "20px",
};

const listItem = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "1.8",
  margin: "8px 0",
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
