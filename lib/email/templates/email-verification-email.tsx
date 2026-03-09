import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Link,
} from '@react-email/components';

export interface EmailVerificationEmailProps {
  name: string;
  verificationLink: string;
}

const baseUrl = process.env.RESEND_FROM_EMAIL || 'https://waitslessfood.com';

export default function EmailVerificationEmail({
  name,
  verificationLink,
}: EmailVerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Verify Your Email</Heading>

            <Text style={paragraph}>Hi {name},</Text>

            <Text style={paragraph}>
              Thanks for creating an account with Waistless Foods! To complete your signup, please
              verify your email address by clicking the button below.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={verificationLink}>
                Verify Email Address
              </Button>
            </Section>

            <Text style={paragraph}>
              Or copy and paste this link in your browser:
            </Text>

            <Link href={verificationLink} style={link}>
              {verificationLink}
            </Link>

            <Hr style={hr} />

            <Text style={footer}>
              This verification link will expire in 24 hours. If you didn't create this account,
              you can safely ignore this email.
            </Text>

            <Text style={footer}>
              Waistless Foods Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f4f4f4',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const heading = {
  color: '#0F3B3D',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '16px 0',
};

const paragraph = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0f8dab',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  margin: '0 auto',
  maxWidth: '200px',
};

const link = {
  color: '#0f8dab',
  textDecoration: 'underline',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
};

const hr = {
  borderColor: '#e5e5e5',
  margin: '32px 0',
};

const footer = {
  color: '#8b8b8b',
  fontSize: '13px',
  lineHeight: '24px',
  margin: '16px 0',
};
