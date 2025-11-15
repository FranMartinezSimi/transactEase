import { createClient } from "@shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    console.log("[API] GET /api/organization/members - Starting request");
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

    console.log("[API] User authenticated:", user.id);

    // Get user's profile and organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error("[API] Profile error:", profileError, "Profile:", profile);
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    console.log("[API] User profile:", {
      org_id: profile.organization_id,
      role: profile.role,
    });

    // Check if user is admin or owner
    const isAdmin = profile.role === "admin" || profile.role === "owner";
    if (!isAdmin) {
      console.error("[API] Insufficient permissions. Role:", profile.role);
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get all members of the organization
    const { data: members, error: membersError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, is_active, created_at")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: true });

    if (membersError) {
      console.error("[API] Error fetching members:", membersError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    console.log(
      "[API] Members fetched successfully. Count:",
      members?.length || 0
    );

    return NextResponse.json(
      {
        success: true,
        members: members || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Unexpected error fetching members:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organization/members
 * Add a new member to the organization
 */
export async function POST(req: NextRequest) {
  try {
    console.log("[API] POST /api/organization/members - Starting request");
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

    console.log("[API] User authenticated:", user.id);

    // Get user's profile and organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error("[API] Profile error:", profileError, "Profile:", profile);
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    console.log("[API] User profile:", {
      org_id: profile.organization_id,
      role: profile.role,
    });

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
    const { email, role, full_name } = body;
    console.log("[API] Request body:", { email, role, full_name });

    if (!email || !role) {
      console.error("[API] Missing required fields");
      return NextResponse.json(
        { success: false, error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["admin", "member"].includes(role)) {
      console.error("[API] Invalid role:", role);
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be 'admin' or 'member'" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();
    const emailDomain = emailLower.split("@")[1];

    if (!emailDomain) {
      console.error("[API] Invalid email format:", emailLower);
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    console.log("[API] Email domain extracted:", emailDomain);

    // Get organization domain
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("domain, name")
      .eq("id", profile.organization_id)
      .single();

    if (orgError || !org) {
      console.error("[API] Error fetching organization:", orgError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch organization" },
        { status: 500 }
      );
    }

    console.log("[API] Organization domain:", org.domain);

    // Validate email domain matches organization domain (only if domain is set)
    if (org.domain && emailDomain !== org.domain) {
      console.error(
        "[API] Email domain mismatch. Expected:",
        org.domain,
        "Got:",
        emailDomain
      );
      return NextResponse.json(
        {
          success: false,
          error: `Email domain must match organization domain (@${org.domain})`,
        },
        { status: 400 }
      );
    }

    // Check if user already exists with this email
    console.log("[API] Checking if user exists:", emailLower);
    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("id, organization_id, email")
      .eq("email", emailLower)
      .single();

    console.log("[API] User lookup result:", { existingUser, checkError });

    // If user exists and already belongs to an organization
    if (existingUser && existingUser.organization_id) {
      console.error(
        "[API] User already belongs to organization:",
        existingUser.organization_id
      );
      return NextResponse.json(
        {
          success: false,
          error: "User already belongs to an organization",
        },
        { status: 400 }
      );
    }

    // If user exists but has no organization, add them
    if (existingUser && !existingUser.organization_id) {
      console.log("[API] User exists without organization, adding them now");
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          organization_id: profile.organization_id,
          role: role,
          is_active: true,
        })
        .eq("id", existingUser.id);

      if (updateError) {
        console.error("[API] Error updating user:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to add user to organization" },
          { status: 500 }
        );
      }

      console.log("[API] User added to organization successfully");
      return NextResponse.json(
        {
          success: true,
          message: `${emailLower} has been added to your organization`,
        },
        { status: 200 }
      );
    }

    // User doesn't exist yet - they will be auto-assigned when they log in via SSO
    console.log(
      "[API] User doesn't exist yet - they will be auto-assigned on SSO login"
    );

    // TODO: Store the pre-assigned role somewhere so when they login they get this specific role
    // For now, they'll get the default "member" role via the trigger
    // Future enhancement: Store email -> role mapping in organizations table

    // TODO: Send notification email
    // await sendNotificationEmail(emailLower, full_name, org.name);

    return NextResponse.json(
      {
        success: true,
        message: `${emailLower} has been registered. They will be automatically added to your organization when they sign in with SSO.`,
        requiresRegistration: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Unexpected error adding member:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
