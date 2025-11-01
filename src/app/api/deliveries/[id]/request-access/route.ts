import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@shared/lib/supabase/server";
import { sendAccessCode } from "@shared/lib/email/send-access-code";
import crypto from "node:crypto";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deliveryId } = await context.params;
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

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
      console.error("[request-access] Failed to send email:", emailError);
      // Code was saved but email failed - still return success
      // User might retry and we can resend
      return NextResponse.json({
        message:
          "Access code generated but email failed to send. Please try again.",
        expiresAt: expiresAt.toISOString(),
      });
    }
  } catch (error: any) {
    console.error("[POST /api/deliveries/[id]/request-access] error:", error);
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
