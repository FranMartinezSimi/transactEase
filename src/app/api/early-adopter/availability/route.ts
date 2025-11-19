import { createClient } from "@shared/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/early-adopter/availability
 * Check if early adopter slots are available
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Call database function to check availability
    const { data, error } = await supabase.rpc("check_early_adopter_availability");

    if (error) {
      console.error("[Early Adopter] Error checking availability:", error);
      return NextResponse.json(
        { success: false, error: "Failed to check availability" },
        { status: 500 }
      );
    }

    const availability = data?.[0] || {
      available: false,
      slots_remaining: 0,
      program_active: false,
    };

    return NextResponse.json(
      {
        success: true,
        available: availability.available,
        slotsRemaining: availability.slots_remaining,
        programActive: availability.program_active,
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
