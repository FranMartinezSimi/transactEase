import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@shared/lib/supabase/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deliveryId } = await context.params;
    const body = await req.json();
    const { code, email } = body;

    if (!code || !email) {
      return NextResponse.json(
        { message: "Code and email are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find the most recent non-verified access code for this delivery and email
    const { data: accessCodes, error: fetchError } = await supabase
      .from("delivery_access_codes")
      .select("*")
      .eq("delivery_id", deliveryId)
      .eq("recipient_email", email)
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError || !accessCodes || accessCodes.length === 0) {
      return NextResponse.json(
        { message: "No valid access code found. Please request a new one." },
        { status: 404 }
      );
    }

    const accessCodeRecord = accessCodes[0];

    // Check if code has expired
    if (new Date(accessCodeRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { message: "Access code has expired. Please request a new one." },
        { status: 403 }
      );
    }

    // Check if max attempts reached
    if (accessCodeRecord.attempts >= accessCodeRecord.max_attempts) {
      return NextResponse.json(
        {
          message:
            "Maximum verification attempts reached. Please request a new code.",
          attemptsRemaining: 0,
        },
        { status: 403 }
      );
    }

    // Verify code
    if (accessCodeRecord.code !== code) {
      // Increment attempts
      const newAttempts = accessCodeRecord.attempts + 1;
      await supabase
        .from("delivery_access_codes")
        .update({ attempts: newAttempts })
        .eq("id", accessCodeRecord.id);

      const attemptsRemaining = accessCodeRecord.max_attempts - newAttempts;

      return NextResponse.json(
        {
          message: `Invalid code. ${attemptsRemaining} attempt(s) remaining.`,
          attemptsRemaining,
        },
        { status: 401 }
      );
    }

    // Code is correct - mark as verified
    const { error: updateError } = await supabase
      .from("delivery_access_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", accessCodeRecord.id);

    if (updateError) {
      console.error(
        "[verify-access] Error updating verification status:",
        updateError
      );
    }

    // Log successful access
    const clientIP =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Get delivery to determine viewer type
    const { data: delivery } = await supabase
      .from("deliveries")
      .select("recipient_email")
      .eq("id", deliveryId)
      .single();

    const viewerType =
      delivery && email === delivery.recipient_email ? "recipient" : "sender";

    const { error: logError } = await supabase.from("access_logs").insert({
      delivery_id: deliveryId,
      action: "code_verified",
      ip_address: clientIP,
      user_agent: req.headers.get("user-agent") || "unknown",
      metadata: {
        email,
        code_id: accessCodeRecord.id,
        viewer_type: viewerType,
      },
      success: true,
    });

    if (logError) {
      console.error("[verify-access] Failed to insert access log:", logError);
    }

    return NextResponse.json({
      message: "Access granted",
      verified: true,
    });
  } catch (error: any) {
    console.error("[POST /api/deliveries/[id]/verify-access] error:", error);
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
