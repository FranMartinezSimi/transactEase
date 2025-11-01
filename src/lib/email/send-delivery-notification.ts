import { resend, EMAIL_CONFIG } from "./resend";
import { DeliveryNotificationEmail } from "@/emails/DeliveryNotification";
import { createContextLogger } from "@/lib/logger";

const log = createContextLogger({ service: "EmailService" });

interface SendDeliveryNotificationParams {
  recipientEmail: string;
  senderEmail: string;
  deliveryId: string;
  deliveryTitle: string;
  deliveryMessage?: string;
  expiresAt: string;
  maxViews: number;
  maxDownloads: number;
  fileCount: number;
}

export async function sendDeliveryNotification({
  recipientEmail,
  senderEmail,
  deliveryId,
  deliveryTitle,
  deliveryMessage,
  expiresAt,
  maxViews,
  maxDownloads,
  fileCount,
}: SendDeliveryNotificationParams) {
  try {
    // Build delivery link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const deliveryLink = `${baseUrl}/delivery/${deliveryId}`;

    const emailLog = log.child({
      operation: "sendDeliveryNotification",
      recipientEmail,
      deliveryId,
      senderEmail,
    });

    emailLog.debug("Sending delivery notification email");

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: recipientEmail,
      subject: `🔒 ${senderEmail} sent you secure files: ${deliveryTitle}`,
      react: DeliveryNotificationEmail({
        recipientEmail,
        senderEmail,
        deliveryTitle,
        deliveryMessage,
        deliveryLink,
        expiresAt,
        maxViews,
        maxDownloads,
        fileCount,
      }),
    });

    if (error) {
      emailLog.error({ error }, "Failed to send delivery notification");
      throw new Error(`Failed to send email: ${error.message}`);
    }

    emailLog.info({ emailId: data?.id }, "Delivery notification sent successfully");
    return { success: true, emailId: data?.id };
  } catch (error: any) {
    log.error(
      {
        error,
        operation: "sendDeliveryNotification",
        recipientEmail,
        deliveryId,
      },
      "Error sending delivery notification"
    );
    throw error;
  }
}

// Optional: Email for when delivery is downloaded
interface SendDownloadNotificationParams {
  senderEmail: string;
  recipientEmail: string;
  deliveryTitle: string;
  fileName: string;
  downloadedAt: string;
}

export async function sendDownloadNotification({
  senderEmail,
  recipientEmail,
  deliveryTitle,
  fileName,
  downloadedAt,
}: SendDownloadNotificationParams) {
  const downloadLog = log.child({
    operation: "sendDownloadNotification",
    senderEmail,
    recipientEmail,
    deliveryTitle,
  });

  try {
    downloadLog.debug("Sending download notification email");

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: senderEmail,
      subject: `📥 Your delivery "${deliveryTitle}" was downloaded`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">Download Notification</h2>
          <p>Your secure delivery has been accessed:</p>
          <ul>
            <li><strong>Delivery:</strong> ${deliveryTitle}</li>
            <li><strong>File:</strong> ${fileName}</li>
            <li><strong>Downloaded by:</strong> ${recipientEmail}</li>
            <li><strong>Downloaded at:</strong> ${new Date(downloadedAt).toLocaleString()}</li>
          </ul>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            This is an automated notification from Sealdrop.
          </p>
        </div>
      `,
    });

    if (error) {
      downloadLog.error({ error }, "Failed to send download notification");
      return { success: false };
    }

    downloadLog.info({ emailId: data?.id }, "Download notification sent");
    return { success: true, emailId: data?.id };
  } catch (error: any) {
    downloadLog.error({ error }, "Error sending download notification");
    return { success: false };
  }
}
