import { createClient } from "@shared/lib/supabase/server";
import { sendUserInvitation } from "@shared/lib/email/send-user-invitation";
import { NextRequest, NextResponse } from "next/server";
import { checkSubscriptionLimits } from "@shared/lib/subscription/guards";

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
      .select("organization_id, role, email, full_name")
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
      .select("organization_id, role, email, full_name")
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
      console.error("[API] Missing required fields in request body");
      return NextResponse.json(
        { success: false, error: "Missing required fields: email, role" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["admin", "member"].includes(role)) {
      console.error("[API] Invalid role provided:", role);
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

    // Check subscription user limit using centralized guard
    const subscriptionCheck = await checkSubscriptionLimits(
      supabase,
      profile.organization_id,
      "add_member"
    );

    if (!subscriptionCheck.allowed) {
      console.error(
        "[API] Subscription check failed:",
        subscriptionCheck.reason,
        subscriptionCheck.metadata
      );
      return NextResponse.json(
        {
          success: false,
          error: subscriptionCheck.reason,
          ...subscriptionCheck.metadata,
        },
        { status: subscriptionCheck.statusCode || 402 }
      );
    }

    console.log("[API] Subscription check passed, proceeding with member addition");

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
      .select("id, organization_id, email, full_name")
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

      // Send notification email
      try {
        await sendUserInvitation({
          invitedEmail: emailLower,
          invitedName: full_name || existingUser.full_name,
          organizationName: org.name,
          invitedByName: profile.full_name,
          invitedByEmail: profile.email,
          role: role,
        });
        console.log("[API] Invitation email sent successfully");
      } catch (emailError) {
        console.error("[API] Failed to send invitation email:", emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json(
        {
          success: true,
          message: `${emailLower} has been added to your organization`,
        },
        { status: 200 }
      );
    }

    // User doesn't exist yet - create a pending invitation
    console.log(
      "[API] User doesn't exist yet - creating pending invitation"
    );

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabase
      .from("organization_invitations")
      .insert({
        organization_id: profile.organization_id,
        email: emailLower,
        full_name: full_name || null,
        role: role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (invitationError) {
      console.error("[API] Error creating invitation:", invitationError);

      if (invitationError.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "An invitation already exists for this email",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to create invitation" },
        { status: 500 }
      );
    }

    console.log("[API] Invitation created successfully:", invitation.id);

    // Send notification email
    try {
      await sendUserInvitation({
        invitedEmail: emailLower,
        invitedName: full_name,
        organizationName: org.name,
        invitedByName: profile.full_name,
        invitedByEmail: profile.email,
        role: role,
      });
      console.log("[API] Invitation email sent successfully");
    } catch (emailError) {
      console.error("[API] Failed to send invitation email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: `Invitation sent to ${emailLower}. They will be automatically added to your organization when they sign in with SSO.`,
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
