import { Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import type { CSSProperties } from 'react';
import type { NewsletterContent } from '@/lib/newsletter-content';
import { isNewsletterAddressReady } from '@/lib/newsletter-address';

const siteUrl = 'https://www.waistlessfoods.com';

// Body moves its spacing/background into an inner table cell; override that too.
// Inline styles are the fallback for clients that strip media queries.
const emailCss = `
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  @media only screen and (max-width: 600px) {
    .newsletter-body > table > tbody > tr > td { padding: 16px 8px !important; }
    .newsletter-content { padding: 28px 24px 32px !important; }
    .newsletter-masthead { padding: 24px 20px !important; }
    .newsletter-title { font-size: 30px !important; line-height: 38px !important; }
    .newsletter-footer { padding: 24px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .newsletter-body, .newsletter-body > table > tbody > tr > td { background-color: #172526 !important; }
    .newsletter-card, .newsletter-content { background-color: #233536 !important; }
    .newsletter-masthead, .newsletter-footer { background-color: #1c2e2f !important; }
    .newsletter-title { color: #f5f0e7 !important; }
    .newsletter-copy { color: #dde6e3 !important; }
    .newsletter-muted { color: #b9cdca !important; }
    .newsletter-accent, .newsletter-link { color: #8dd9d7 !important; }
    .newsletter-button { background-color: #8dd9d7 !important; color: #123a3d !important; }
    .newsletter-rule { border-color: #496160 !important; }
    .newsletter-logo-tile { background-color: #ffffff !important; }
    .newsletter-preview { background-color: #463a21 !important; color: #ffe2a5 !important; }
  }
`;

export default function NewsletterIssueEmail({ issue, campaign }: {
  issue: NewsletterContent;
  campaign?: { unsubscribeUrl: string; mailingAddress: string };
}) {
  const configuredAddress = campaign
    ? campaign.mailingAddress
    : process.env.NEWSLETTER_MAILING_ADDRESS?.trim() || '';
  const address = isNewsletterAddressReady(configuredAddress) ? configuredAddress : '';

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{emailCss}</style>
      </Head>
      <Preview>{issue.previewText || issue.subject}</Preview>
      <Body className="newsletter-body" style={styles.body}>
        <Container className="newsletter-card" style={styles.card}>
          <Section style={styles.brandBar}>
            <Text style={styles.tagline}>WASTE LESS. TASTE MORE.</Text>
          </Section>
          <Section className="newsletter-masthead newsletter-rule" style={styles.masthead}>
            <Section className="newsletter-logo-tile" style={styles.logoTile}>
              <Link href={siteUrl} aria-label="Visit WaistLess Foods">
                <Img src={`${siteUrl}/logo.png`} width="112" height="112" alt="WaistLess Foods" style={styles.logo} />
              </Link>
            </Section>
            <Text className="newsletter-accent" style={styles.publication}>The WaistLess Table</Text>
            <Text className="newsletter-muted" style={styles.byline}>FROM CHEF AMBER’S KITCHEN</Text>
          </Section>
          <Section className="newsletter-content" style={styles.content}>
            {!campaign && (
              <Text className="newsletter-preview" style={styles.preview}>
                PREVIEW ONLY — This test was not sent to subscribers.
              </Text>
            )}
            <Text className="newsletter-accent" style={styles.eyebrow}>A NOTE FROM THE TABLE</Text>
            <Heading as="h1" className="newsletter-title" style={styles.title}>{issue.title}</Heading>
            {issue.previewText && <Text className="newsletter-muted newsletter-rule" style={styles.intro}>{issue.previewText}</Text>}
            {issue.body.split(/\n\s*\n/).map((paragraph, index) => (
              <Text className="newsletter-copy" key={index} style={styles.paragraph}>{paragraph}</Text>
            ))}
            {issue.ctaUrl && (
              <Section style={{ paddingTop: '8px' }}>
                <Button className="newsletter-button" href={issue.ctaUrl} style={styles.button}>{issue.ctaLabel}</Button>
              </Section>
            )}
          </Section>
          <Section className="newsletter-footer newsletter-rule" style={styles.footer}>
            <Text className="newsletter-accent" style={styles.footerBrand}>Waste less. Taste more.</Text>
            <Text className="newsletter-muted" style={styles.footerText}>
              <Link className="newsletter-link" href={siteUrl} style={styles.footerLink}>waistlessfoods.com</Link>
            </Text>
            <Text className="newsletter-muted" style={styles.footerText}>
              {campaign
                ? <>You received this newsletter because you subscribed to WaistLess Foods.</>
                : <>Administrator preview. No subscriber status was changed.</>}
            </Text>
            {campaign && <Text style={styles.footerText}><Link className="newsletter-link" href={campaign.unsubscribeUrl} style={styles.footerLink}>Unsubscribe from newsletters</Link></Text>}
            {address && <Text className="newsletter-muted" style={styles.footerText}>{address}</Text>}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, CSSProperties> = {
  body: { margin: '0', padding: '32px 12px', backgroundColor: '#f3efe8', color: '#334e4d', fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif' },
  card: { width: '100%', maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden' },
  brandBar: { backgroundColor: '#00676e', padding: '12px 16px', textAlign: 'center' },
  tagline: { color: '#ffffff', fontSize: '10px', lineHeight: '16px', letterSpacing: '2.5px', fontWeight: '700', margin: '0' },
  masthead: { padding: '28px 32px', backgroundColor: '#faf8f3', borderBottom: '1px solid #e5ded3', textAlign: 'center' },
  logoTile: { width: '128px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '4px' },
  logo: { display: 'block', width: '112px', height: '112px', margin: '8px auto', color: '#00676e', fontSize: '14px' },
  publication: { color: '#00676e', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '26px', lineHeight: '34px', margin: '18px 0 6px' },
  byline: { color: '#526c69', fontSize: '10px', lineHeight: '18px', letterSpacing: '1.5px', margin: '0' },
  content: { padding: '36px 44px 40px', backgroundColor: '#ffffff' },
  preview: { color: '#795018', backgroundColor: '#fff5df', padding: '12px 16px', fontSize: '12px', lineHeight: '20px', margin: '0 0 24px' },
  eyebrow: { color: '#388082', fontSize: '10px', lineHeight: '18px', letterSpacing: '2px', fontWeight: '700', margin: '0 0 12px' },
  title: { color: '#183e40', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '36px', fontWeight: '400', lineHeight: '44px', margin: '0 0 20px', overflowWrap: 'anywhere' },
  intro: { color: '#526c69', fontSize: '17px', lineHeight: '28px', margin: '0 0 24px', paddingBottom: '24px', borderBottom: '1px solid #e5ded3', overflowWrap: 'anywhere' },
  paragraph: { color: '#334e4d', fontSize: '16px', lineHeight: '28px', margin: '0 0 20px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  button: { display: 'inline-block', backgroundColor: '#00676e', color: '#ffffff', fontSize: '14px', lineHeight: '22px', fontWeight: '700', padding: '14px 24px', borderRadius: '4px', textDecoration: 'none', maxWidth: '100%', boxSizing: 'border-box', overflowWrap: 'anywhere' },
  footer: { padding: '28px 44px', backgroundColor: '#faf8f3', borderTop: '1px solid #e5ded3', textAlign: 'center' },
  footerBrand: { color: '#00676e', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '20px', lineHeight: '28px', margin: '0 0 8px' },
  footerText: { color: '#526c69', fontSize: '12px', lineHeight: '20px', margin: '0 0 8px', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' },
  footerLink: { color: '#00676e', textDecoration: 'underline' },
};
