"use server";

import { revalidatePath } from "next/cache";
import { createServerClient, sendDeliveryNotification } from "@shared";

/**
 * Revoke a delivery (mark as revoked)
 */
export async function revokeDelivery(deliveryId: string) {
  try {
    const supabase = await createServerClient();

    // Get delivery details first
    const { data: delivery, error: fetchError } = await supabase
      .from("deliveries")
      .select("id, title, status")
      .eq("id", deliveryId)
      .single();

    if (fetchError || !delivery) {
      return { success: false, error: "Delivery not found" };
    }

    if (delivery.status !== "active") {
      return { success: false, error: "Only active deliveries can be revoked" };
    }

    // Update status to revoked
    const { error: updateError } = await supabase
      .from("deliveries")
      .update({
        status: "revoked",
        updated_at: new Date().toISOString()
      })
      .eq("id", deliveryId);

    if (updateError) {
      console.error("[revokeDelivery] Error:", updateError);
      return { success: false, error: "Failed to revoke delivery" };
    }

    // Revalidate dashboard
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("[revokeDelivery] Unexpected error:", error);
    return { success: false, error: error?.message || "Server error" };
  }
}

/**
 * Delete a delivery and its associated files
 */
export async function deleteDelivery(deliveryId: string) {
  try {
    const supabase = await createServerClient();

    // Verify user has permission (must be sender or admin)
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get delivery to check ownership
    const { data: delivery, error: fetchError } = await supabase
      .from("deliveries")
      .select("id, sender_id")
      .eq("id", deliveryId)
      .single();

    if (fetchError || !delivery) {
      return { success: false, error: "Delivery not found" };
    }

    // Check if user is the sender
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    const isOwner = delivery.sender_id === user.id;
    const isAdmin = profile?.role === "admin" || profile?.role === "owner";

    if (!isOwner && !isAdmin) {
      return { success: false, error: "You don't have permission to delete this delivery" };
    }

    // Delete delivery files first (FK constraint)
    const { error: filesError } = await supabase
      .from("delivery_files")
      .delete()
      .eq("delivery_id", deliveryId);

    if (filesError) {
      console.error("[deleteDelivery] Error deleting files:", filesError);
      return { success: false, error: "Failed to delete delivery files" };
    }

    // Delete delivery
    const { error: deleteError } = await supabase
      .from("deliveries")
      .delete()
      .eq("id", deliveryId);

    if (deleteError) {
      console.error("[deleteDelivery] Error deleting delivery:", deleteError);
      return { success: false, error: "Failed to delete delivery" };
    }

    // Revalidate dashboard
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("[deleteDelivery] Unexpected error:", error);
    return { success: false, error: error?.message || "Server error" };
  }
}

/**
 * Resend delivery notification email
 */
export async function resendDeliveryNotification(deliveryId: string) {
  try {
    const supabase = await createServerClient();

    // Get delivery details
    const { data: delivery, error: fetchError } = await supabase
      .from("deliveries")
      .select(`
        id,
        title,
        message,
        recipient_email,
        status,
        sender:profiles!deliveries_sender_id_fkey (
          full_name,
          email
        )
      `)
      .eq("id", deliveryId)
      .single();

    if (fetchError || !delivery) {
      return { success: false, error: "Delivery not found" };
    }

    if (delivery.status !== "active") {
      return { success: false, error: "Can only resend notifications for active deliveries" };
    }

    // Get delivery link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const deliveryLink = `${baseUrl}/delivery/${delivery.id}`;

    // Send notification email
    try {
      await sendDeliveryNotification({
        recipientEmail: delivery.recipient_email,
        senderName: delivery.sender?.full_name || "Someone",
        senderEmail: delivery.sender?.email || "unknown",
        deliveryTitle: delivery.title,
        deliveryMessage: delivery.message,
        deliveryLink,
      });

      return { success: true };
    } catch (emailError: any) {
      console.error("[resendDeliveryNotification] Email error:", emailError);
      return { success: false, error: "Failed to send email notification" };
    }
  } catch (error: any) {
    console.error("[resendDeliveryNotification] Unexpected error:", error);
    return { success: false, error: error?.message || "Server error" };
  }
}

/**
 * Get delivery public link
 */
export async function getDeliveryLink(deliveryId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  return `${baseUrl}/delivery/${deliveryId}`;
}
