import { resend, EMAIL_CONFIG } from "./resend";
import { UserInvitationEmail } from "@/emails/UserInvitationEmail";
import { createContextLogger } from "@shared/lib/logger";

const log = createContextLogger({ service: "EmailService" });

interface SendUserInvitationParams {
  invitedEmail: string;
  invitedName?: string;
  organizationName: string;
  invitedByName: string;
  invitedByEmail: string;
  role: "admin" | "member";
  loginLink?: string;
}

/**
 * Send invitation email to a new user added to an organization
 */
export async function sendUserInvitation({
  invitedEmail,
  invitedName,
  organizationName,
  invitedByName,
  invitedByEmail,
  role,
  loginLink,
}: SendUserInvitationParams) {
  try {
    // Use provided loginLink or build it
    const finalLoginLink =
      loginLink ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`;

    const emailLog = log.child({
      operation: "sendUserInvitation",
      invitedEmail,
      organizationName,
      invitedByEmail,
      role,
    });

    emailLog.debug("Sending user invitation email");

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: invitedEmail,
      subject: `You've been invited to join ${organizationName} on Sealdrop`,
      react: UserInvitationEmail({
        invitedEmail,
        invitedName,
        organizationName,
        invitedByName,
        invitedByEmail,
        role,
        loginLink: finalLoginLink,
      }),
    });

    if (error) {
      emailLog.error({ error }, "Failed to send user invitation email");
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }

    emailLog.info({ emailId: data?.id }, "User invitation email sent successfully");

    return {
      success: true,
      emailId: data?.id,
    };
  } catch (error) {
    log.error(
      { error, invitedEmail, organizationName },
      "Unexpected error sending user invitation email"
    );
    throw error;
  }
}
