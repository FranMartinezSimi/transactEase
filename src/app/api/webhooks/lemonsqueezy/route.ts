import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@shared/lib/supabase/admin";
import { LEMONSQUEEZY_CONFIG } from "@shared/lib/lemonsqueezy/config";

/**
 * POST /api/webhooks/lemonsqueezy
 * Webhook para eventos de Lemon Squeezy
 *
 * Eventos importantes:
 * - order_created: Pago exitoso (one-time)
 * - subscription_created: Suscripción creada
 * - subscription_updated: Suscripción actualizada (upgrade/downgrade)
 * - subscription_cancelled: Suscripción cancelada
 * - subscription_resumed: Suscripción reanudada
 * - subscription_expired: Suscripción expirada
 * - subscription_payment_success: Pago recurrente exitoso
 * - subscription_payment_failed: Pago recurrente fallido
 *
 * Configuración en Lemon Squeezy:
 * 1. Ir a Settings → Webhooks
 * 2. Crear webhook con URL: https://tudominio.com/api/webhooks/lemonsqueezy
 * 3. Copiar el Secret y agregarlo a LEMONSQUEEZY_WEBHOOK_SECRET
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-signature");

    if (!signature) {
      console.error("[Webhook] Missing signature");
      return NextResponse.json(
        { message: "Missing signature" },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const secret = LEMONSQUEEZY_CONFIG.webhookSecret;
    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(body).digest("hex");

    if (digest !== signature) {
      console.error("[Webhook] Invalid signature");
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse event
    const event = JSON.parse(body);
    const eventName = event.meta.event_name;
    const customData = event.meta.custom_data;
    const organizationId = customData?.organization_id;

    console.log(`[Webhook] Received event: ${eventName} for org: ${organizationId}`);

    if (!organizationId) {
      console.error("[Webhook] Missing organization_id in custom_data");
      return NextResponse.json(
        { message: "Missing organization_id" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Handle different events
    switch (eventName) {
      case "subscription_created":
      case "subscription_updated": {
        const subscription = event.data.attributes;
        const variantId = subscription.variant_id;

        // Determine plan based on variant ID
        let plan = "starter";
        let deliveries_limit = 50;
        let storage_limit_gb = 10;
        let users_limit = 5;

        if (variantId === LEMONSQUEEZY_CONFIG.plans.pro.variantId) {
          plan = "pro";
          deliveries_limit = 500;
          storage_limit_gb = 50;
          users_limit = 20;
        } else if (variantId === LEMONSQUEEZY_CONFIG.plans.enterprise.variantId) {
          plan = "enterprise";
          deliveries_limit = 999999; // "unlimited"
          storage_limit_gb = 500;
          users_limit = 999;
        }

        // Update subscription in database
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            plan,
            status: subscription.status === "active" ? "active" : "past_due",
            deliveries_limit,
            storage_limit_gb,
            users_limit,
            stripe_subscription_id: subscription.id.toString(), // Using Lemon Squeezy subscription ID
            stripe_customer_id: subscription.customer_id.toString(),
            current_period_start: subscription.renews_at,
            current_period_end: subscription.ends_at,
            updated_at: new Date().toISOString(),
          })
          .eq("organization_id", organizationId);

        if (updateError) {
          console.error("[Webhook] Error updating subscription:", updateError);
          return NextResponse.json(
            { message: "Failed to update subscription" },
            { status: 500 }
          );
        }

        console.log(`[Webhook] Subscription updated for org ${organizationId} to ${plan}`);
        break;
      }

      case "subscription_cancelled": {
        const { error: cancelError } = await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("organization_id", organizationId);

        if (cancelError) {
          console.error("[Webhook] Error cancelling subscription:", cancelError);
          return NextResponse.json(
            { message: "Failed to cancel subscription" },
            { status: 500 }
          );
        }

        console.log(`[Webhook] Subscription cancelled for org ${organizationId}`);
        break;
      }

      case "subscription_expired": {
        const { error: expireError } = await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("organization_id", organizationId);

        if (expireError) {
          console.error("[Webhook] Error expiring subscription:", expireError);
          return NextResponse.json(
            { message: "Failed to expire subscription" },
            { status: 500 }
          );
        }

        console.log(`[Webhook] Subscription expired for org ${organizationId}`);
        break;
      }

      case "subscription_payment_failed": {
        const { error: failError } = await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("organization_id", organizationId);

        if (failError) {
          console.error("[Webhook] Error marking payment failed:", failError);
          return NextResponse.json(
            { message: "Failed to update payment status" },
            { status: 500 }
          );
        }

        console.log(`[Webhook] Payment failed for org ${organizationId}`);
        break;
      }

      case "subscription_payment_success": {
        const { error: successError } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("organization_id", organizationId);

        if (successError) {
          console.error("[Webhook] Error marking payment success:", successError);
          return NextResponse.json(
            { message: "Failed to update payment status" },
            { status: 500 }
          );
        }

        console.log(`[Webhook] Payment successful for org ${organizationId}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
