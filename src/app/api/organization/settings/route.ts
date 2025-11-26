import { createClient } from "@shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/organization/settings
 * Get organization settings
 */
export async function GET(req: NextRequest) {
  try {
    console.log("[API] GET /api/organization/settings - Starting request");
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
      console.error("[API] Insufficient permissions. Role:", profile.role);
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get organization settings
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select(
        "id, name, domain, logo_url, max_expiration_hours, min_expiration_hours, max_views, max_downloads, created_at, updated_at"
      )
      .eq("id", profile.organization_id)
      .single();

    if (orgError) {
      console.error("[API] Error fetching organization:", orgError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch organization settings" },
        { status: 500 }
      );
    }

    console.log("[API] Organization settings fetched successfully");

    return NextResponse.json(
      {
        success: true,
        organization,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Unexpected error fetching organization settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organization/settings
 * Update organization settings
 */
export async function PUT(req: NextRequest) {
  try {
    console.log("[API] PUT /api/organization/settings - Starting request");
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
      console.error("[API] Insufficient permissions. Role:", profile.role);
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      name,
      domain,
      logo_url,
      max_expiration_hours,
      min_expiration_hours,
      max_views,
      max_downloads,
    } = body;

    console.log("[API] Request body:", {
      name,
      domain,
      has_logo: !!logo_url,
      max_expiration_hours,
      min_expiration_hours,
      max_views,
      max_downloads,
    });

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (domain !== undefined) updateData.domain = domain;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (max_expiration_hours !== undefined)
      updateData.max_expiration_hours = max_expiration_hours;
    if (min_expiration_hours !== undefined)
      updateData.min_expiration_hours = min_expiration_hours;
    if (max_views !== undefined) updateData.max_views = max_views;
    if (max_downloads !== undefined) updateData.max_downloads = max_downloads;

    // Validate min/max expiration hours
    if (
      updateData.min_expiration_hours !== undefined &&
      updateData.max_expiration_hours !== undefined &&
      updateData.min_expiration_hours > updateData.max_expiration_hours
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Min expiration hours cannot be greater than max expiration hours",
        },
        { status: 400 }
      );
    }

    // Update organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from("organizations")
      .update(updateData)
      .eq("id", profile.organization_id)
      .select()
      .single();

    if (updateError) {
      console.error("[API] Error updating organization:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update organization settings" },
        { status: 500 }
      );
    }

    console.log("[API] Organization settings updated successfully");

    return NextResponse.json(
      {
        success: true,
        organization: updatedOrg,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Unexpected error updating organization settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
