import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface AccessCodeEmailProps {
  recipientEmail: string;
  accessCode: string;
  deliveryTitle: string;
  expiresInMinutes: number;
}

export const AccessCodeEmail = ({
  accessCode = "123456",
  deliveryTitle = "Important Documents",
  expiresInMinutes = 15,
}: AccessCodeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your access code for {deliveryTitle}: {accessCode}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={heading}>🔒 Sealdrop</Heading>
            <Text style={tagline}>Secure Document Access</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              Your Access Code
            </Heading>

            <Text style={text}>
              Use this code to access your secure delivery:
            </Text>

            {/* Access Code Display */}
            <Section style={codeBox}>
              <Text style={codeText}>{accessCode}</Text>
            </Section>

            <Text style={text}>
              <strong>Delivery:</strong> {deliveryTitle}
            </Text>

            {/* Important Info */}
            <Section style={warningBox}>
              <Text style={warningTitle}>⏰ Important</Text>
              <ul style={list}>
                <li style={listItem}>
                  This code expires in <strong>{expiresInMinutes} minutes</strong>
                </li>
                <li style={listItem}>
                  You have <strong>3 attempts</strong> to enter the correct code
                </li>
                <li style={listItem}>
                  The code is case-sensitive
                </li>
                <li style={listItem}>
                  Do not share this code with anyone
                </li>
              </ul>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              If you didn't request this code, please ignore this email.
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Sealdrop. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AccessCodeEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 20px",
  textAlign: "center" as const,
  backgroundColor: "#10b981",
};

const heading = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#ffffff",
  margin: "0",
};

const tagline = {
  fontSize: "14px",
  color: "#ffffff",
  margin: "8px 0 0",
  opacity: 0.9,
};

const content = {
  padding: "0 48px",
};

const h2 = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#1f2937",
  marginTop: "32px",
  marginBottom: "16px",
};

const text = {
  fontSize: "16px",
  color: "#4b5563",
  lineHeight: "24px",
  margin: "16px 0",
};

const codeBox = {
  backgroundColor: "#f9fafb",
  border: "3px solid #10b981",
  borderRadius: "12px",
  padding: "32px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const codeText = {
  fontSize: "48px",
  fontWeight: "bold",
  color: "#10b981",
  letterSpacing: "8px",
  margin: "0",
  fontFamily: "monospace",
};

const warningBox = {
  backgroundColor: "#fef3c7",
  borderLeft: "4px solid #f59e0b",
  borderRadius: "4px",
  padding: "16px 20px",
  margin: "24px 0",
};

const warningTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#92400e",
  margin: "0 0 8px 0",
};

const list = {
  margin: "0",
  padding: "0 0 0 20px",
};

const listItem = {
  fontSize: "14px",
  color: "#4b5563",
  lineHeight: "24px",
  margin: "4px 0",
};

const footer = {
  padding: "0 48px",
  marginTop: "32px",
};

const footerText = {
  fontSize: "12px",
  color: "#9ca3af",
  lineHeight: "20px",
  textAlign: "center" as const,
  margin: "8px 0",
};
