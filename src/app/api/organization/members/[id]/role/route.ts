import { createClient } from "@shared/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * PATCH /api/organization/members/[id]/role
 * Change a member's role in the organization
 */
export async function PATCH(
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

    // Only owner can change roles
    const isOwner = profile.role === "owner"
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Only the owner can change member roles" },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { role } = body

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role is required" },
        { status: 400 }
      )
    }

    // Validate role
    if (!["admin", "member"].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid role. Must be 'admin' or 'member'",
        },
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

    // Cannot change owner role
    if (targetMember.role === "owner") {
      return NextResponse.json(
        { success: false, error: "Cannot change owner role" },
        { status: 400 }
      )
    }

    // Update member role
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", memberId)

    if (updateError) {
      console.error("[API] Error updating member role:", updateError)
      return NextResponse.json(
        { success: false, error: "Failed to update member role" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Member role updated successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[API] Unexpected error updating member role:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
