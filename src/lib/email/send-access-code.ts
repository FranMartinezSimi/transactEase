import { Resend } from "resend";
import { AccessCodeEmail } from "@/emails/AccessCodeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_CONFIG = {
  from: "Sealdrop <noreply@sealdrop.xyz>",
  replyTo: "support@sealdrop.xyz",
};

interface SendAccessCodeParams {
  recipientEmail: string;
  accessCode: string;
  deliveryTitle: string;
  expiresInMinutes?: number;
}

export async function sendAccessCode({
  recipientEmail,
  accessCode,
  deliveryTitle,
  expiresInMinutes = 15,
}: SendAccessCodeParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: recipientEmail,
      subject: `🔐 Your access code: ${accessCode}`,
      react: AccessCodeEmail({
        recipientEmail,
        accessCode,
        deliveryTitle,
        expiresInMinutes,
      }),
    });

    if (error) {
      console.error("[sendAccessCode] Resend error:", error);
      throw new Error(`Failed to send access code email: ${error.message}`);
    }

    console.log("[sendAccessCode] Email sent successfully:", data?.id);
    return data;
  } catch (error: any) {
    console.error("[sendAccessCode] Unexpected error:", error);
    throw error;
  }
}
