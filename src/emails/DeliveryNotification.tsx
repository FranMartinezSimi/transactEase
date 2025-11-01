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
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { CSSProperties } from "react";

interface DeliveryNotificationEmailProps {
  recipientEmail: string;
  senderEmail: string;
  deliveryTitle: string;
  deliveryMessage?: string;
  deliveryLink: string;
  expiresAt: string;
  maxViews: number;
  maxDownloads: number;
  fileCount: number;
}

export const DeliveryNotificationEmail = ({
  recipientEmail = "recipient@example.com",
  senderEmail = "sender@example.com",
  deliveryTitle = "Important Documents",
  deliveryMessage,
  deliveryLink = "https://sealdrop.com/delivery/abc-123",
  expiresAt = "2025-12-31T23:59:59Z",
  maxViews = 10,
  maxDownloads = 1,
  fileCount = 1,
}: DeliveryNotificationEmailProps) => {
  const expiresDate = new Date(expiresAt);
  const formattedDate = expiresDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Html>
      <Head />
      <Preview>
        {`${senderEmail} has sent you ${fileCount} secure ${fileCount === 1 ? "file" : "files"}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Heading style={heading}>🔒 Sealdrop</Heading>
            <Text style={tagline}>Secure Temporary Document Delivery</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              You've received secure documents
            </Heading>

            <Text style={text}>
              <strong>{senderEmail}</strong> has sent you {fileCount} secure{" "}
              {fileCount === 1 ? "file" : "files"}:
            </Text>

            <Section style={deliveryBox}>
              <Text className="text-lg text-gray-900 font-bold">{deliveryTitle}</Text>
              {deliveryMessage && (
                <Text className="text-sm text-gray-500">&quot;{deliveryMessage}&quot;</Text>
              )}
            </Section>


            {/* Security Info */}
            <Section style={securityInfo}>
              <Text style={securityTitle}>🛡️ Security Details</Text>
              <ul style={list}>
                <li style={listItem}>
                  <strong>Expires:</strong> {formattedDate}
                </li>
                <li style={listItem}>
                  <strong>Max Views:</strong> {maxViews}
                </li>
                <li style={listItem}>
                  <strong>Max Downloads:</strong> {maxDownloads}
                </li>
                <li style={listItem}>
                  <strong>Files:</strong> {fileCount}
                </li>
              </ul>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={deliveryLink}>
                View & Download Files
              </Button>
            </Section>

            <Text style={smallText}>
              Or copy and paste this link into your browser:
            </Text>
            <Link href={deliveryLink} style={link}>
              {deliveryLink}
            </Link>

            <Hr style={hr} />

            {/* Important Notes */}
            <Section style={warningBox}>
              <Text style={warningTitle}>⚠️ Important Notes</Text>
              <ul style={list}>
                <li style={listItem}>
                  This delivery will <strong>self-destruct</strong> when it reaches the view or
                  download limits
                </li>
                <li style={listItem}>
                  You'll need to verify your email address ({recipientEmail}) to access the files
                </li>
                <li style={listItem}>
                  Each file has a SHA-256 hash that you can use to verify its integrity
                </li>
                <li style={listItem}>
                  All access is logged for security and audit purposes
                </li>
              </ul>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This is an automated message from Sealdrop. If you believe you received this in
              error, please contact the sender directly.
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

export default DeliveryNotificationEmail;

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

const deliveryBox = {
  backgroundColor: "#f9fafb",
  border: "2px solid #10b981",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const deliveryTitle = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0 0 8px 0",
};

const deliveryMessageText = {
  fontSize: "14px",
  color: "#6b7280",
  fontStyle: "italic",
  margin: "8px 0 0 0",
};

const securityInfo = {
  backgroundColor: "#eff6ff",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const securityTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1e40af",
  margin: "0 0 12px 0",
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

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const smallText = {
  fontSize: "12px",
  color: "#6b7280",
  textAlign: "center" as const,
  margin: "16px 0 8px",
};

const link = {
  color: "#10b981",
  fontSize: "12px",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
  display: "block",
  textAlign: "center" as const,
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
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
