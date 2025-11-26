import { createClient } from "@shared/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * DELETE /api/organization/members/[id]
 * Remove a member from the organization
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: memberId } = await params

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's profile and organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      )
    }

    // Check if user is admin or owner
    const isAdmin = profile.role === "admin" || profile.role === "owner"
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Cannot remove yourself
    if (memberId === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot remove yourself from the organization" },
        { status: 400 }
      )
    }

    // Get target member
    const { data: targetMember, error: targetError } = await supabase
      .from("profiles")
      .select("id, organization_id, role")
      .eq("id", memberId)
      .single()

    if (targetError || !targetMember) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      )
    }

    // Verify member belongs to same organization
    if (targetMember.organization_id !== profile.organization_id) {
      return NextResponse.json(
        { success: false, error: "Member not in your organization" },
        { status: 403 }
      )
    }

    // Cannot remove owner
    if (targetMember.role === "owner") {
      return NextResponse.json(
        { success: false, error: "Cannot remove the organization owner" },
        { status: 400 }
      )
    }

    // Admin can only remove members, not other admins (only owner can remove admins)
    if (profile.role === "admin" && targetMember.role === "admin") {
      return NextResponse.json(
        { success: false, error: "Only the owner can remove admins" },
        { status: 403 }
      )
    }

    // Remove member from organization
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        organization_id: null,
        role: "member",
        is_active: false,
      })
      .eq("id", memberId)

    if (updateError) {
      console.error("[API] Error removing member:", updateError)
      return NextResponse.json(
        { success: false, error: "Failed to remove member" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Member removed from organization successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[API] Unexpected error removing member:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
