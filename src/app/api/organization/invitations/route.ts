import { createClient } from "@shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/organization/invitations
 * Get all pending invitations for the organization
 */
export async function GET(req: NextRequest) {
  try {
    console.log("[API] GET /api/organization/invitations - Starting request");
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

    // Check if user is admin or owner
    const isAdmin = profile.role === "admin" || profile.role === "owner";
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get all pending invitations for the organization
    const { data: invitations, error: invitationsError } = await supabase
      .from("organization_invitations")
      .select("id, email, full_name, role, invited_at, invited_by")
      .eq("organization_id", profile.organization_id)
      .eq("is_accepted", false)
      .order("invited_at", { ascending: false });

    if (invitationsError) {
      console.error("[API] Error fetching invitations:", invitationsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch invitations" },
        { status: 500 }
      );
    }

    console.log(
      "[API] Invitations fetched successfully. Count:",
      invitations?.length || 0
    );

    return NextResponse.json(
      {
        success: true,
        invitations: invitations || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Unexpected error fetching invitations:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
