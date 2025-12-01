import { createClient } from "@shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/early-adopter/claim
 * Claim an early adopter slot for the current organization
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    // Only owners and admins can claim early adopter slot
    if (profile.role !== "owner" && profile.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only owners and admins can claim early adopter slots" },
        { status: 403 }
      );
    }

    // Call database function to claim slot (atomic operation)
    const { data, error } = await supabase.rpc("claim_early_adopter_slot", {
      org_id: profile.organization_id,
    });

    if (error) {
      console.error("[Early Adopter] Error claiming slot:", error);
      return NextResponse.json(
        { success: false, error: "Failed to claim slot" },
        { status: 500 }
      );
    }

    const result = data?.[0] || {
      success: false,
      message: "Unknown error",
      is_early_adopter: false,
    };

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 }
      );
    }

    // If successful, create or update subscription with early_adopter plan
    const { error: subError } = await supabase
      .from("subscriptions")
      .upsert({
        organization_id: profile.organization_id,
        plan: "early_adopter",
        status: "active",
        deliveries_limit: 10,  // 10 deliveries per month for early adopters
        storage_limit_gb: 0.5,  // 500MB storage for early adopters
        users_limit: 1,
        max_file_size_mb: 10,
        ai_compliance_enabled: false,
        custom_branding: false,
        api_access: false,
      }, {
        onConflict: "organization_id",
      });

    if (subError) {
      console.error("[Early Adopter] Error creating subscription:", subError);
      // Continue anyway, the organization is marked as early adopter
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        isEarlyAdopter: result.is_early_adopter,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Early Adopter] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
