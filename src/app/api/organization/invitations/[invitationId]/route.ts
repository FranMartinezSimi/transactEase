import { createClient } from "@shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/organization/invitations/[invitationId]
 * Cancel a pending invitation
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { invitationId: string } }
) {
  try {
    const { invitationId } = params;
    console.log(
      "[API] DELETE /api/organization/invitations/[invitationId] - Invitation ID:",
      invitationId
    );
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

    // Verify the invitation belongs to the user's organization
    const { data: invitation, error: invitationCheckError } = await supabase
      .from("organization_invitations")
      .select("organization_id")
      .eq("id", invitationId)
      .single();

    if (invitationCheckError || !invitation) {
      console.error("[API] Invitation not found:", invitationCheckError);
      return NextResponse.json(
        { success: false, error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.organization_id !== profile.organization_id) {
      console.error("[API] Invitation belongs to different organization");
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from("organization_invitations")
      .delete()
      .eq("id", invitationId);

    if (deleteError) {
      console.error("[API] Error deleting invitation:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete invitation" },
        { status: 500 }
      );
    }

    console.log("[API] Invitation cancelled successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Invitation cancelled successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Unexpected error cancelling invitation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
