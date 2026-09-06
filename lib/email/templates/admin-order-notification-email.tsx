import {
  Body, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from "@react-email/components";

interface AdminOrderNotificationEmailProps {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderTotal: string;
  orderDate: string;
  items: { name: string; quantity: number; price: string }[];
  includesCookingClass?: boolean;
  isTest?: boolean;
}

export default function AdminOrderNotificationEmail({
  customerName, customerEmail, orderNumber, orderTotal, orderDate, items,
  includesCookingClass = false, isTest = false,
}: AdminOrderNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`${isTest ? "TEST — " : ""}Paid order #${orderNumber}: ${orderTotal}`}</Preview>
      <Body style={{ backgroundColor: "#f3f7f7", fontFamily: "Arial, sans-serif", color: "#25434a" }}>
        <Container style={{ backgroundColor: "#ffffff", margin: "32px auto", padding: "32px", borderRadius: "8px" }}>
          <Heading style={{ color: "#0F8DAB", fontSize: "24px" }}>New paid order</Heading>
          {isTest && (
            <Text style={{ backgroundColor: "#fff3dc", padding: "12px", fontWeight: "bold" }}>
              TEST PAYMENT — No real money was charged. Do not fulfill this order.
            </Text>
          )}
          <Text>A customer has completed checkout on WaistLess Foods.</Text>
          <Section>
            <Text><strong>Order:</strong> #{orderNumber}</Text>
            <Text><strong>Date:</strong> {orderDate}</Text>
            <Text><strong>Customer:</strong> {customerName}</Text>
            <Text><strong>Email:</strong> {customerEmail}</Text>
          </Section>
          <Heading as="h2" style={{ fontSize: "18px" }}>Items purchased</Heading>
          {items.map((item, index) => (
            <Text key={index} style={{ borderBottom: "1px solid #e1eaea", paddingBottom: "12px" }}>
              {item.name}<br />
              Quantity: {item.quantity} · Unit price: {item.price}
            </Text>
          ))}
          <Text style={{ fontWeight: "bold", fontSize: "18px" }}>Total paid: {orderTotal}</Text>
          {includesCookingClass && <Text>This order includes cooking class seats. Review the class dates and quantities above.</Text>}
          <Text>Reply to this email to contact the customer.</Text>
          <Link href="https://www.waistlessfoods.com/admin/dashboard" style={{ color: "#0F8DAB" }}>
            Open the admin dashboard (sign-in required)
          </Link>
        </Container>
      </Body>
    </Html>
  );
}

AdminOrderNotificationEmail.PreviewProps = {
  customerName: "Example Customer",
  customerEmail: "customer@example.com",
  orderNumber: "1042",
  orderTotal: "$10.80",
  orderDate: "September 6, 2026",
  items: [{ name: "Seasonal Recipe", quantity: 2, price: "$5.00" }],
  isTest: true,
} satisfies AdminOrderNotificationEmailProps;
