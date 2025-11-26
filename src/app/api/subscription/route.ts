import { createClient } from "@shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/subscription
 * Get current organization subscription and usage
 */
export async function GET(req: NextRequest) {
  try {
    console.log("[API] GET /api/subscription - Starting request");
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[API] Auth error:", authError);
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's profile and organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error("[API] Profile error:", profileError);
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    console.log("[API] User profile:", {
      org_id: profile.organization_id,
      role: profile.role,
    });

    // Get subscription info using database function (includes usage stats)
    const { data: subscriptionInfo, error: subError } = await supabase.rpc(
      "get_subscription_info",
      { org_id: profile.organization_id }
    );

    if (subError) {
      console.error("[API] Error fetching subscription:", subError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch subscription" },
        { status: 500 }
      );
    }

    const subscription = subscriptionInfo?.[0];

    if (!subscription) {
      console.log("[API] No subscription found");
      return NextResponse.json(
        { success: false, error: "No subscription found" },
        { status: 404 }
      );
    }

    console.log("[API] Subscription fetched successfully");

    return NextResponse.json(
      {
        success: true,
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          deliveries_limit: subscription.deliveries_limit,
          deliveries_used: subscription.deliveries_used,
          storage_limit_gb: subscription.storage_limit_gb,
          storage_used_gb: subscription.storage_used_gb,
          users_limit: subscription.users_limit,
          ai_compliance_enabled: subscription.ai_compliance_enabled,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Unexpected error fetching subscription:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
