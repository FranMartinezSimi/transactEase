import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@shared/lib/supabase/server";
import { sendAccessCode } from "@shared/lib/email/send-access-code";
import { deleteDeliveryFilesFromS3 } from "@shared/lib/aws/delete-delivery-files";
import { logger } from "@shared/lib/logger";
import { withRateLimit, RateLimitPresets } from "@shared/lib/rate-limit";
import { requestAccessSchema } from "@shared/utils/validations/delivery";
import { sanitizeEmail } from "@shared/lib/sanitize";
import crypto from "node:crypto";

async function requestAccessHandler(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deliveryId } = await context.params;
    const body = await req.json();

    // Validate and sanitize input
    const validation = requestAccessSchema.safeParse({
      email: sanitizeEmail(body.email),
    });

    if (!validation.success) {
      const errors = validation.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          message: "Invalid input",
          errors,
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    const supabase = await createClient();

    // Get delivery and verify email matches recipient
    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .select("id, title, recipient_email, status, expires_at")
      .eq("id", deliveryId)
      .single();

    if (deliveryError || !delivery) {
      return NextResponse.json(
        { message: "Delivery not found" },
        { status: 404 }
      );
    }

    // Verify email matches recipient
    if (delivery.recipient_email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { message: "Email does not match recipient" },
        { status: 403 }
      );
    }

    // Check if delivery is active
    if (delivery.status !== "active") {
      return NextResponse.json(
        { message: "Delivery is not active" },
        { status: 403 }
      );
    }

    // Check if delivery has expired
    if (new Date(delivery.expires_at) < new Date()) {
      return NextResponse.json(
        { message: "Delivery has expired" },
        { status: 403 }
      );
    }

    // Generate 6-digit code
    const accessCode = crypto.randomInt(100000, 999999).toString();

    // Set expiration to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Store access code in database
    const { error: insertError } = await supabase
      .from("delivery_access_codes")
      .insert({
        delivery_id: deliveryId,
        code: accessCode,
        recipient_email: email,
        expires_at: expiresAt.toISOString(),
        max_attempts: 3,
      });

    if (insertError) {
      console.error("[request-access] Error storing access code:", insertError);
      return NextResponse.json(
        { message: "Failed to generate access code" },
        { status: 500 }
      );
    }

    // Send access code via email
    try {
      await sendAccessCode({
        recipientEmail: email,
        accessCode,
        deliveryTitle: delivery.title,
        expiresInMinutes: 15,
      });

      return NextResponse.json({
        message: "Access code sent to your email",
        expiresAt: expiresAt.toISOString(),
      });
    } catch (emailError: any) {
      logger.error({
        message: "Failed to send access code email",
        deliveryId,
        error: emailError,
      });
      // Code was saved but email failed - still return success
      // User might retry and we can resend
      return NextResponse.json({
        message:
          "Access code generated but email failed to send. Please try again.",
        expiresAt: expiresAt.toISOString(),
      });
    }
  } catch (error: any) {
    logger.error({
      message: "Error in request-access endpoint",
      deliveryId: context?.params ? await context.params.then(p => p.id) : "unknown",
      error,
    });
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply rate limiting to the endpoint (strict - 5 requests per minute)
export const POST = withRateLimit(requestAccessHandler, RateLimitPresets.strict);
