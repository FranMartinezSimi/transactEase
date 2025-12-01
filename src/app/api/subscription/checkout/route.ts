import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@shared/lib/supabase/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { LEMONSQUEEZY_CONFIG } from "@shared/lib/lemonsqueezy/config";

/**
 * POST /api/subscription/checkout
 * Crea un checkout session de Lemon Squeezy
 *
 * Body: {
 *   plan: "starter" | "pro" | "enterprise"
 * }
 *
 * Returns: {
 *   checkoutUrl: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get profile with organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*, organization:organizations(*)")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 }
      );
    }

    // Only owner can manage billing
    if (profile.role !== "owner") {
      return NextResponse.json(
        { message: "Only organization owner can manage billing" },
        { status: 403 }
      );
    }

    // Parse request body
    const { plan } = await req.json();

    if (!plan || !["starter", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { message: "Invalid plan. Must be starter, pro, or enterprise" },
        { status: 400 }
      );
    }

    const variantId = LEMONSQUEEZY_CONFIG.plans[plan as keyof typeof LEMONSQUEEZY_CONFIG.plans].variantId;

    if (!variantId || variantId === "your_starter_variant_id") {
      return NextResponse.json(
        { message: `Plan ${plan} not configured yet. Please configure variant ID in environment variables.` },
        { status: 503 }
      );
    }

    // Create checkout session
    const checkout = await createCheckout(
      LEMONSQUEEZY_CONFIG.storeId,
      variantId,
      {
        checkoutData: {
          email: user.email || profile.email,
          name: profile.full_name || "",
          custom: {
            organization_id: profile.organization_id,
            user_id: user.id,
          },
        },
        productOptions: {
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?checkout=success`,
        },
      }
    );

    if (checkout.error) {
      console.error("[Checkout] Error creating checkout:", checkout.error);
      return NextResponse.json(
        { message: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkoutUrl: checkout.data?.data.attributes.url,
    }, { status: 200 });
  } catch (error) {
    console.error("[Checkout] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
