import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Centralized subscription validation
 * Single source of truth for all subscription checks
 */

export type SubscriptionAction =
  | "create_delivery"
  | "add_member"
  | "upload_file"
  | "access_features";

export interface SubscriptionCheckResult {
  allowed: boolean;
  reason?: string;
  statusCode?: number;
  metadata?: {
    plan?: string;
    deliveriesUsed?: number;
    deliveriesLimit?: number;
    currentMembers?: number;
    usersLimit?: number;
    fileSizeMB?: number;
    maxFileSizeMB?: number;
    currentStorageGB?: number;
    storageLimitGB?: number;
  };
}

/**
 * Main function to check if an organization can perform an action
 */
export async function checkSubscriptionLimits(
  supabase: SupabaseClient,
  organizationId: string,
  action: SubscriptionAction,
  metadata?: {
    fileSizeBytes?: number;
  }
): Promise<SubscriptionCheckResult> {
  try {
    // Get subscription info
    const { data: subscriptionInfo, error: subError } = await supabase.rpc(
      "get_subscription_info",
      { org_id: organizationId }
    );

    if (subError || !subscriptionInfo) {
      return {
        allowed: false,
        reason: "Failed to fetch subscription information",
        statusCode: 500,
      };
    }

    const {
      status,
      plan,
      deliveries_limit,
      deliveries_used,
      storage_limit_gb,
      storage_used_gb,
      users_limit,
      max_file_size_mb,
    } = subscriptionInfo;

    // Check 1: Subscription must be active
    if (status !== "active") {
      return {
        allowed: false,
        reason: `Subscription is ${status}. Please update your payment method.`,
        statusCode: 402,
        metadata: { plan },
      };
    }

    // Check 2: Action-specific validations
    switch (action) {
      case "create_delivery":
      case "upload_file": {
        // Check delivery limit (except for early_adopter and enterprise)
        if (plan !== "early_adopter" && plan !== "enterprise") {
          if (deliveries_used >= deliveries_limit) {
            return {
              allowed: false,
              reason: `Delivery limit reached (${deliveries_used}/${deliveries_limit}). Please upgrade your plan.`,
              statusCode: 402,
              metadata: {
                plan,
                deliveriesUsed: deliveries_used,
                deliveriesLimit: deliveries_limit,
              },
            };
          }
        }

        // Check file size if provided
        if (metadata?.fileSizeBytes) {
          const fileSizeMB = metadata.fileSizeBytes / (1024 * 1024);
          if (fileSizeMB > max_file_size_mb) {
            return {
              allowed: false,
              reason: `File size (${fileSizeMB.toFixed(2)} MB) exceeds your plan limit of ${max_file_size_mb} MB`,
              statusCode: 413,
              metadata: {
                fileSizeMB: parseFloat(fileSizeMB.toFixed(2)),
                maxFileSizeMB: max_file_size_mb,
              },
            };
          }

          // Check storage limit
          const currentStorageGB = storage_used_gb || 0;
          const newStorageGB =
            currentStorageGB + metadata.fileSizeBytes / (1024 * 1024 * 1024);

          if (newStorageGB > storage_limit_gb) {
            return {
              allowed: false,
              reason: `Storage limit exceeded. This file would use ${newStorageGB.toFixed(2)} GB of your ${storage_limit_gb} GB limit`,
              statusCode: 507,
              metadata: {
                currentStorageGB: parseFloat(currentStorageGB.toFixed(2)),
                storageLimitGB: storage_limit_gb,
              },
            };
          }
        }

        return { allowed: true };
      }

      case "add_member": {
        // Count current members
        const { count: currentMembers, error: countError } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId);

        if (countError) {
          return {
            allowed: false,
            reason: "Failed to count current members",
            statusCode: 500,
          };
        }

        if (currentMembers !== null && currentMembers >= users_limit) {
          return {
            allowed: false,
            reason: `User limit reached (${currentMembers}/${users_limit}). Please upgrade your plan to add more members.`,
            statusCode: 402,
            metadata: {
              currentMembers,
              usersLimit: users_limit,
            },
          };
        }

        return { allowed: true };
      }

      case "access_features": {
        // Just check if subscription is active (already checked above)
        return { allowed: true };
      }

      default:
        return {
          allowed: false,
          reason: "Unknown action",
          statusCode: 400,
        };
    }
  } catch (error) {
    console.error("[SubscriptionGuard] Error checking limits:", error);
    return {
      allowed: false,
      reason: "Internal server error while checking subscription",
      statusCode: 500,
    };
  }
}

/**
 * Increment delivery usage counter
 */
export async function incrementDeliveryUsage(
  supabase: SupabaseClient,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc("increment_delivery_usage", {
      org_id: organizationId,
    });

    if (error) {
      console.error("[SubscriptionGuard] Error incrementing usage:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[SubscriptionGuard] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get subscription status for UI display
 */
export async function getSubscriptionStatus(
  supabase: SupabaseClient,
  organizationId: string
): Promise<{
  isActive: boolean;
  isLimitReached: boolean;
  plan: string;
  deliveriesUsed: number;
  deliveriesLimit: number;
} | null> {
  try {
    const { data: subscriptionInfo } = await supabase.rpc(
      "get_subscription_info",
      { org_id: organizationId }
    );

    if (!subscriptionInfo) return null;

    const isActive = subscriptionInfo.status === "active";
    const isLimitReached =
      subscriptionInfo.plan !== "early_adopter" &&
      subscriptionInfo.plan !== "enterprise" &&
      subscriptionInfo.deliveries_used >= subscriptionInfo.deliveries_limit;

    return {
      isActive,
      isLimitReached,
      plan: subscriptionInfo.plan,
      deliveriesUsed: subscriptionInfo.deliveries_used,
      deliveriesLimit: subscriptionInfo.deliveries_limit,
    };
  } catch (error) {
    console.error("[SubscriptionGuard] Error getting status:", error);
    return null;
  }
}
