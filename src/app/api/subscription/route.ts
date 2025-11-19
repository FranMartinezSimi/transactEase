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

    // Get subscription for the organization
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .single();

    if (subError) {
      console.error("[API] Error fetching subscription:", subError);

      // If no subscription exists, return default starter plan info
      if (subError.code === "PGRST116") {
        console.log("[API] No subscription found, returning default starter plan");
        return NextResponse.json(
          {
            success: true,
            subscription: {
              plan: "starter",
              status: "trial",
              max_deliveries_per_month: 50,
              max_storage_gb: 5,
              max_users: 3,
              max_file_size: 25,
              ai_compliance_enabled: false,
              deliveries_this_month: 0,
              storage_used_gb: 0,
            },
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to fetch subscription" },
        { status: 500 }
      );
    }

    console.log("[API] Subscription fetched successfully");

    return NextResponse.json(
      {
        success: true,
        subscription,
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
