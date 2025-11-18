import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface UserInvitationEmailProps {
  invitedEmail: string;
  invitedName?: string;
  organizationName: string;
  invitedByName: string;
  invitedByEmail: string;
  role: "admin" | "member";
  loginLink: string;
}

export const UserInvitationEmail = ({
  invitedEmail,
  invitedName,
  organizationName,
  invitedByName,
  invitedByEmail,
  role,
  loginLink,
}: UserInvitationEmailProps) => {
  const displayName = invitedName || invitedEmail.split("@")[0];
  const roleDisplay = role === "admin" ? "Administrator" : "Member";

  return (
    <Html>
      <Head />
      <Preview>
        You've been invited to join {organizationName} on Sealdrop
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={heading}>🔒 Sealdrop</Heading>
            <Text style={tagline}>Secure Document Delivery Platform</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              You've been invited! 🎉
            </Heading>

            <Text style={text}>
              Hi {displayName},
            </Text>

            <Text style={text}>
              <strong>{invitedByName}</strong> ({invitedByEmail}) has invited
              you to join <strong>{organizationName}</strong> on Sealdrop as a{" "}
              <strong>{roleDisplay}</strong>.
            </Text>

            {/* Invitation Details Box */}
            <Section style={invitationBox}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={labelCell}>Organization:</td>
                    <td style={valueCell}>{organizationName}</td>
                  </tr>
                  <tr>
                    <td style={labelCell}>Your Role:</td>
                    <td style={valueCell}>{roleDisplay}</td>
                  </tr>
                  <tr>
                    <td style={labelCell}>Invited By:</td>
                    <td style={valueCell}>
                      {invitedByName} ({invitedByEmail})
                    </td>
                  </tr>
                  <tr>
                    <td style={labelCell}>Your Email:</td>
                    <td style={valueCell}>{invitedEmail}</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* What happens next */}
            <Section style={infoBox}>
              <Heading as="h3" style={h3}>
                What happens next?
              </Heading>
              <Text style={listText}>
                1. Click the button below to sign in with Google
              </Text>
              <Text style={listText}>
                2. You'll be automatically added to {organizationName}
              </Text>
              <Text style={listText}>
                3. Start sending and receiving secure documents immediately
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={loginLink}>
                Sign in with Google
              </Button>
            </Section>

            <Text style={smallText}>
              Or copy and paste this URL into your browser:{" "}
              <Link href={loginLink} style={link}>
                {loginLink}
              </Link>
            </Text>

            <Hr style={hr} />

            {/* Role Permissions Info */}
            <Section style={permissionsBox}>
              <Heading as="h4" style={h4}>
                Your permissions as {roleDisplay}:
              </Heading>
              {role === "admin" ? (
                <>
                  <Text style={permissionItem}>✅ Create and manage deliveries</Text>
                  <Text style={permissionItem}>✅ View all organization deliveries</Text>
                  <Text style={permissionItem}>✅ Manage team members</Text>
                  <Text style={permissionItem}>✅ Configure organization settings</Text>
                  <Text style={permissionItem}>✅ Access compliance reports</Text>
                  <Text style={permissionItem}>✅ View audit logs</Text>
                </>
              ) : (
                <>
                  <Text style={permissionItem}>✅ Create and manage your own deliveries</Text>
                  <Text style={permissionItem}>✅ View your delivery history</Text>
                  <Text style={permissionItem}>✅ Access your audit logs</Text>
                  <Text style={{ ...smallText, marginTop: "8px" }}>
                    Note: As a Member, you can only see your own deliveries. Contact an
                    Administrator if you need elevated permissions.
                  </Text>
                </>
              )}
            </Section>

            <Hr style={hr} />

            {/* Security Notice */}
            <Section style={securityBox}>
              <Text style={securityText}>
                🔒 <strong>Security Notice:</strong> This invitation is automatically
                processed when you sign in with the email address {invitedEmail}. If you
                didn't expect this invitation, please contact {invitedByEmail}.
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Need help? Contact us at{" "}
              <Link href="mailto:support@sealdrop.xyz" style={link}>
                support@sealdrop.xyz
              </Link>
            </Text>
            <Text style={footerText}>
              Sealdrop - Secure Temporary Document Delivery
            </Text>
            <Text style={footerText}>
              <Link href="https://sealdrop.com" style={link}>
                sealdrop.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

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
  padding: "32px 24px",
  backgroundColor: "#1e293b",
  borderRadius: "8px 8px 0 0",
};

const heading = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#ffffff",
  margin: "0",
  textAlign: "center" as const,
};

const tagline = {
  fontSize: "14px",
  color: "#94a3b8",
  margin: "8px 0 0",
  textAlign: "center" as const,
};

const content = {
  padding: "24px",
};

const h2 = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1e293b",
  margin: "0 0 16px",
};

const h3 = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#334155",
  margin: "0 0 12px",
};

const h4 = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#475569",
  margin: "0 0 12px",
};

const text = {
  fontSize: "16px",
  color: "#334155",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const listText = {
  fontSize: "14px",
  color: "#475569",
  lineHeight: "20px",
  margin: "0 0 8px",
  paddingLeft: "8px",
};

const smallText = {
  fontSize: "14px",
  color: "#64748b",
  lineHeight: "20px",
  margin: "16px 0",
};

const invitationBox = {
  backgroundColor: "#f8fafc",
  border: "2px solid #e2e8f0",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const labelCell = {
  fontSize: "14px",
  color: "#64748b",
  padding: "8px 16px 8px 0",
  fontWeight: "500",
  width: "40%",
};

const valueCell = {
  fontSize: "14px",
  color: "#1e293b",
  padding: "8px 0",
  fontWeight: "600",
};

const infoBox = {
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const permissionsBox = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const permissionItem = {
  fontSize: "14px",
  color: "#166534",
  lineHeight: "20px",
  margin: "0 0 6px",
};

const securityBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #fde047",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const securityText = {
  fontSize: "13px",
  color: "#713f12",
  lineHeight: "18px",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const footer = {
  padding: "24px",
  borderTop: "1px solid #e2e8f0",
};

const footerText = {
  fontSize: "12px",
  color: "#64748b",
  lineHeight: "16px",
  textAlign: "center" as const,
  margin: "4px 0",
};

export default UserInvitationEmail;
