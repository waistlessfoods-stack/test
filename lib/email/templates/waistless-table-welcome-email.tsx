import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface WaistlessTableWelcomeEmailProps {
  logoUrl?: string;
  siteUrl?: string;
  unsubscribeUrl?: string;
}

const highlights = [
  {
    title: "Exclusive Recipes",
    body: "Restaurant-inspired recipes and techniques designed to bring elevated, flavorful cooking into your own kitchen.",
  },
  {
    title: "Culinary Inspiration",
    body: "Seasonal ingredients, cooking techniques, stories, and insights to help you cook with more intention and creativity.",
  },
  {
    title: "WasteLess Tips",
    body: "Simple, practical ways to make the most of your ingredients, reduce food waste, and cook more thoughtfully.",
  },
  {
    title: "Members-Only Offers",
    body: "Enjoy exclusive discounts and early access to select WaistLess Foods private chef services, catering experiences, and cooking classes.",
  },
];

export default function WaistlessTableWelcomeEmail({
  logoUrl,
  siteUrl = "https://www.waistlessfoods.com",
  unsubscribeUrl = "https://www.waistlessfoods.com/unsubscribe",
}: WaistlessTableWelcomeEmailProps) {
  const resolvedLogoUrl =
    logoUrl ?? `${siteUrl.replace(/\/$/, "")}/logo.png`;

  return (
    <Html>
      <Head />
      <Preview>
        Welcome to The WaistLess Table—recipes, inspiration, thoughtful cooking, and more.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Link href={siteUrl}>
              <Img
                src={resolvedLogoUrl}
                width="104"
                height="104"
                alt="WaistLess Foods"
                style={brandLogo}
              />
            </Link>
          </Section>

          <Section style={hero}>
            <Text style={eyebrow}>WELCOME TO</Text>
            <Heading style={heroTitle}>The WaistLess Table</Heading>
            <Text style={heroSubtitle}>Indulge intentionally. Cook creatively.</Text>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={greeting}>
              Hello and welcome to The WaistLess Table!
            </Heading>

            <Text style={paragraph}>I’m so glad you’re here!</Text>

            <Text style={paragraph}>
              By joining The WaistLess Table, you’re getting more than a place to find
              recipes—you’re getting a seat at the table for all things WaistLess Foods.
            </Text>

            <Text style={paragraph}>
              You can expect a curated mix of content from the world of WaistLess Foods,
              including exclusive recipes, culinary inspiration, waste-reducing tips, and
              stories from my kitchen—along with occasional updates on cooking classes,
              events, private chef experiences, and special offers!
            </Text>

            <Text style={sectionIntro}>Here’s what you can expect:</Text>

            <Section style={highlightList}>
              {highlights.map((highlight, index) => (
                <Row key={highlight.title} style={highlightRow}>
                  <Column style={numberColumn} valign="top">
                    <Text style={highlightNumber}>{String(index + 1).padStart(2, "0")}</Text>
                  </Column>
                  <Column style={highlightContent} valign="top">
                    <Heading as="h3" style={highlightTitle}>
                      {highlight.title}
                    </Heading>
                    <Text style={highlightBody}>{highlight.body}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Section style={missionBox}>
              <Text style={missionText}>
                My hope is that what I share here invites you to approach cooking with the
                curiosity of a home cook and the eye of a chef. We’ll explore the
                techniques, skills, and creative details that shape exceptional food—from
                understanding the why behind a technique to finding the artistry in a
                beautifully finished plate. Most of all, I hope you feel inspired to
                experiment, confident enough to trust your instincts, and excited by the
                endless possibilities that begin in your own kitchen.
              </Text>
            </Section>

            <Text style={paragraph}>
              I’m so glad you’re here. I look forward to sharing the creativity, craft,
              and joy of cooking with you.
            </Text>

            <Heading as="h2" style={closingHeading}>
              Welcome to The WaistLess Table.
            </Heading>

            <Text style={signoff}>
              Warmly,
              <br />
              <strong>Chef Amber</strong>
              <br />
              WaistLess Foods
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              You’re receiving this email because you joined The WaistLess Table.
            </Text>
            <Text style={footerText}>
              <Link href={siteUrl} style={footerLink}>
                Visit WaistLess Foods
              </Link>
              <span style={footerSeparator}> • </span>
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
            <Text style={copyright}>© 2026 WaistLess Foods. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

(WaistlessTableWelcomeEmail as typeof WaistlessTableWelcomeEmail & {
  PreviewProps: WaistlessTableWelcomeEmailProps;
}).PreviewProps = {
  logoUrl: "https://www.waistlessfoods.com/logo.png",
  siteUrl: "https://www.waistlessfoods.com",
  unsubscribeUrl: "https://www.waistlessfoods.com/unsubscribe?preview=true",
};

const main = {
  backgroundColor: "#f3efe8",
  color: "#242424",
  fontFamily:
    'Georgia, "Times New Roman", Times, serif',
  margin: "0",
  padding: "32px 12px",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5ded3",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "640px",
  overflow: "hidden",
};

const brandBar = {
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #e5ded3",
  padding: "12px 28px",
  textAlign: "center" as const,
};

const brandLogo = {
  display: "block",
  height: "104px",
  margin: "0 auto",
  objectFit: "contain" as const,
  width: "104px",
};

const hero = {
  backgroundColor: "#d9f1ef",
  padding: "42px 28px 38px",
  textAlign: "center" as const,
};

const eyebrow = {
  color: "#00676e",
  fontFamily: 'Arial, "Helvetica Neue", sans-serif',
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "3px",
  margin: "0 0 12px",
};

const heroTitle = {
  color: "#111111",
  fontSize: "38px",
  fontWeight: "400",
  lineHeight: "1.12",
  margin: "0",
};

const heroSubtitle = {
  color: "#38676a",
  fontFamily: 'Arial, "Helvetica Neue", sans-serif',
  fontSize: "13px",
  fontWeight: "600",
  letterSpacing: "1px",
  margin: "16px 0 0",
  textTransform: "uppercase" as const,
};

const content = {
  padding: "36px 42px 20px",
};

const greeting = {
  color: "#111111",
  fontSize: "25px",
  fontWeight: "400",
  lineHeight: "1.3",
  margin: "0 0 24px",
};

const paragraph = {
  color: "#3f3f3f",
  fontFamily: 'Arial, "Helvetica Neue", sans-serif',
  fontSize: "15px",
  lineHeight: "1.75",
  margin: "0 0 18px",
};

const sectionIntro = {
  color: "#111111",
  fontSize: "18px",
  fontWeight: "700",
  lineHeight: "1.5",
  margin: "30px 0 16px",
};

const highlightList = {
  borderTop: "1px solid #ded8ce",
};

const highlightRow = {
  borderBottom: "1px solid #ded8ce",
};

const numberColumn = {
  padding: "20px 16px 18px 0",
  width: "44px",
};

const highlightNumber = {
  color: "#17a9ad",
  fontFamily: 'Arial, "Helvetica Neue", sans-serif',
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  margin: "2px 0 0",
};

const highlightContent = {
  padding: "18px 0",
};

const highlightTitle = {
  color: "#00676e",
  fontFamily: 'Arial, "Helvetica Neue", sans-serif',
  fontSize: "16px",
  fontWeight: "700",
  lineHeight: "1.4",
  margin: "0 0 5px",
};

const highlightBody = {
  color: "#515151",
  fontFamily: 'Arial, "Helvetica Neue", sans-serif',
  fontSize: "14px",
  lineHeight: "1.65",
  margin: "0",
};

const missionBox = {
  backgroundColor: "#f7f2e9",
  borderLeft: "4px solid #17a9ad",
  margin: "30px 0 26px",
  padding: "20px 22px",
};

const missionText = {
  color: "#303030",
  fontSize: "17px",
  fontStyle: "italic",
  lineHeight: "1.65",
  margin: "0",
};

const closingHeading = {
  color: "#00676e",
  fontSize: "24px",
  fontWeight: "400",
  lineHeight: "1.3",
  margin: "28px 0 18px",
};

const signoff = {
  color: "#3f3f3f",
  fontFamily: 'Arial, "Helvetica Neue", sans-serif',
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 0 20px",
};

const divider = {
  borderColor: "#e5ded3",
  margin: "10px 42px 0",
};

const footer = {
  padding: "22px 42px 30px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#77716a",
  fontFamily: 'Arial, "Helvetica Neue", sans-serif',
  fontSize: "11px",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

const footerLink = {
  color: "#00676e",
  textDecoration: "underline",
};

const footerSeparator = {
  color: "#b0aaa1",
};

const copyright = {
  color: "#99938b",
  fontFamily: 'Arial, "Helvetica Neue", sans-serif',
  fontSize: "10px",
  lineHeight: "1.5",
  margin: "12px 0 0",
};
