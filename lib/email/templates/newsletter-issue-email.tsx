import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components";
import type { NewsletterContent } from "@/lib/newsletter-content";

export default function NewsletterIssueEmail({ issue }: { issue: NewsletterContent }) {
  return (
    <Html>
      <Head />
      <Preview>{issue.previewText || issue.subject}</Preview>
      <Body style={{ backgroundColor: "#f3f8f6", fontFamily: "Arial, sans-serif", color: "#334e4d" }}>
        <Container style={{ margin: "24px auto", backgroundColor: "#ffffff", padding: "32px", borderRadius: "12px" }}>
          <Text style={{ color: "#996000", backgroundColor: "#fff5df", padding: "12px" }}>PREVIEW ONLY — This test was not sent to subscribers.</Text>
          <Text style={{ color: "#367577", fontSize: "12px", letterSpacing: "2px" }}>WAISTLESS FOODS · CHEF AMBER</Text>
          <Heading style={{ color: "#0e4648", fontFamily: "Georgia, serif" }}>The WaistLess Table</Heading>
          <Heading as="h2" style={{ fontSize: "26px", color: "#173d40", overflowWrap: "anywhere" }}>{issue.title}</Heading>
          {issue.previewText && <Text style={{ color: "#687775", fontSize: "17px" }}>{issue.previewText}</Text>}
          <Section>
            {issue.body.split(/\n\s*\n/).map((paragraph, index) => <Text key={index} style={{ fontSize: "16px", lineHeight: "28px", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{paragraph}</Text>)}
          </Section>
          {issue.ctaUrl && <Link href={issue.ctaUrl} style={{ display: "inline-block", backgroundColor: "#086b70", padding: "12px 20px", color: "white", borderRadius: "6px" }}>{issue.ctaLabel}</Link>}
          <Text style={{ borderTop: "1px solid #dce8e5", paddingTop: "24px", fontSize: "12px", color: "#687775" }}>Waste less. Taste more. · waistlessfoods.com<br />Administrator preview. No subscriber status was changed. Broadcast sending is not enabled.</Text>
        </Container>
      </Body>
    </Html>
  );
}
