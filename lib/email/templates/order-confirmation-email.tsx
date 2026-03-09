import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Font,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Column,
} from "@react-email/components";

interface OrderItem {
  name: string;
  price: string;
  quantity: number;
}

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  orderTotal: string;
  items: OrderItem[];
  orderDate: string;
}

export default function OrderConfirmationEmail({
  customerName,
  orderNumber,
  orderTotal,
  items,
  orderDate,
}: OrderConfirmationEmailProps) {
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
      <Preview>Order Confirmation - #{orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={headerTitle}>Order Confirmation</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {customerName},</Text>
            <Text style={paragraph}>
              Thank you for your order! We're excited to prepare your premium recipes.
            </Text>

            <Heading as="h3" style={subHeading}>
              Order Details
            </Heading>
            <Text style={detailsText}>
              <strong>Order Number:</strong> #{orderNumber}
            </Text>
            <Text style={detailsText}>
              <strong>Order Date:</strong> {orderDate}
            </Text>

            <Heading as="h3" style={subHeading}>
              Items Ordered
            </Heading>

            <Section style={tableWrapper}>
              <table style={table}>
                <thead>
                  <tr style={tableHeaderRow}>
                    <th style={tableHeader}>Item</th>
                    <th style={tableHeader}>Qty</th>
                    <th style={tableHeader}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} style={tableRow}>
                      <td style={tableCell}>{item.name}</td>
                      <td style={{ ...tableCell, textAlign: "center" }}>
                        x{item.quantity}
                      </td>
                      <td style={{ ...tableCell, textAlign: "right" }}>
                        {item.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section style={totalSection}>
              <Row>
                <Column align="right">
                  <Text style={totalText}>
                    Total: <span style={totalAmount}>{orderTotal}</span>
                  </Text>
                </Column>
              </Row>
            </Section>

            <Text style={{ ...paragraph, marginTop: "30px" }}>
              We'll send you a tracking update as soon as your order ships.
            </Text>
            <Text style={paragraph}>
              If you have any questions, feel free to reach out!
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

const headerSection = {
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

const subHeading = {
  color: "#0F8DAB",
  fontSize: "18px",
  fontWeight: "700",
  margin: "24px 0 16px 0",
};

const detailsText = {
  color: "#525252",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "8px 0",
};

const tableWrapper = {
  margin: "20px 0",
};

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const tableHeaderRow = {
  backgroundColor: "#f5f5f5",
};

const tableHeader = {
  color: "#525252",
  fontSize: "14px",
  fontWeight: "700",
  padding: "12px",
  textAlign: "left" as const,
  borderBottom: "1px solid #e5e5e5",
};

const tableRow = {
  borderBottom: "1px solid #e5e5e5",
};

const tableCell = {
  color: "#525252",
  fontSize: "14px",
  padding: "12px",
  textAlign: "left" as const,
};

const totalSection = {
  margin: "20px 0",
  paddingTop: "20px",
  textAlign: "right" as const,
};

const totalText = {
  color: "#525252",
  fontSize: "16px",
  fontWeight: "700",
};

const totalAmount = {
  color: "#0F8DAB",
  fontSize: "18px",
  fontWeight: "700",
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
