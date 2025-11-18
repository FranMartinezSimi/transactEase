import { createClient } from "@shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

/**
 * GET /api/audit/compliance-metrics
 * Get compliance metrics for dashboard and reports
 */
export async function GET(req: NextRequest) {
  try {
    console.log("[API] GET /api/audit/compliance-metrics - Starting request");
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
      .select("organization_id, role, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error("[API] Profile error:", profileError);
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    const isAdmin = profile.role === "admin" || profile.role === "owner";

    // Calculate date ranges
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Build query based on role
    let deliveriesQuery = supabase
      .from("deliveries")
      .select("*");

    if (isAdmin) {
      // Admin sees all org deliveries
      deliveriesQuery = deliveriesQuery.eq("organization_id", profile.organization_id);
    } else {
      // Regular user sees only their deliveries
      deliveriesQuery = deliveriesQuery.eq("created_by", user.id);
    }

    const { data: deliveries, error: deliveriesError } = await deliveriesQuery;

    if (deliveriesError) {
      console.error("[API] Error fetching deliveries:", deliveriesError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch deliveries" },
        { status: 500 }
      );
    }

    // Fetch access logs with proper filtering
    let accessLogsQuery = supabase
      .from("access_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    if (!isAdmin) {
      // Regular users only see logs for their deliveries
      const userDeliveryIds = deliveries?.map((d) => d.id) || [];
      if (userDeliveryIds.length > 0) {
        accessLogsQuery = accessLogsQuery.in("delivery_id", userDeliveryIds);
      } else {
        // No deliveries = no logs
        return NextResponse.json({
          success: true,
          metrics: getEmptyMetrics(),
        });
      }
    } else {
      // Admin sees all logs for org deliveries
      const orgDeliveryIds = deliveries?.map((d) => d.id) || [];
      if (orgDeliveryIds.length > 0) {
        accessLogsQuery = accessLogsQuery.in("delivery_id", orgDeliveryIds);
      }
    }

    const { data: accessLogs, error: logsError } = await accessLogsQuery;

    if (logsError) {
      console.error("[API] Error fetching access logs:", logsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch access logs" },
        { status: 500 }
      );
    }

    const logs = accessLogs || [];

    // Calculate metrics
    const totalDeliveries = deliveries?.length || 0;
    const activeDeliveries = deliveries?.filter((d) => d.status === "active").length || 0;
    const expiredDeliveries = deliveries?.filter((d) => d.status === "expired").length || 0;
    const revokedDeliveries = deliveries?.filter((d) => d.status === "revoked").length || 0;

    const totalAccesses = logs.length;
    const successfulAccesses = logs.filter((l) => l.status === "success").length;
    const failedAccesses = logs.filter((l) => l.status === "failed").length;
    const failureRate = totalAccesses > 0 ? (failedAccesses / totalAccesses) * 100 : 0;

    // Time-based metrics
    const currentMonthLogs = logs.filter(
      (l) => new Date(l.timestamp) >= currentMonthStart && new Date(l.timestamp) <= currentMonthEnd
    );
    const lastMonthLogs = logs.filter(
      (l) => new Date(l.timestamp) >= lastMonthStart && new Date(l.timestamp) <= lastMonthEnd
    );

    // Geographic distribution
    const locationCounts: Record<string, number> = {};
    logs.forEach((log) => {
      const location = log.location || "Unknown";
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });
    const topLocations = Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    // Action type distribution
    const actionCounts: Record<string, number> = {};
    logs.forEach((log) => {
      const action = log.action || "unknown";
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    });

    // Average retention time (for expired/revoked deliveries)
    const completedDeliveries = deliveries?.filter(
      (d) => d.status === "expired" || d.status === "revoked"
    ) || [];
    const avgRetentionDays =
      completedDeliveries.length > 0
        ? completedDeliveries.reduce((sum, d) => {
            const created = new Date(d.created_at);
            const expired = new Date(d.expires_at);
            const days = Math.floor((expired.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / completedDeliveries.length
        : 0;

    // Auto-destruction stats
    const autoDestructed = deliveries?.filter(
      (d) =>
        d.status === "expired" &&
        (d.current_downloads >= d.max_downloads || d.current_views >= d.max_views)
    ).length || 0;

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      const monthLogs = logs.filter(
        (l) => new Date(l.timestamp) >= monthStart && new Date(l.timestamp) <= monthEnd
      );
      monthlyTrend.push({
        month: format(monthStart, "MMM yyyy"),
        accesses: monthLogs.length,
        successful: monthLogs.filter((l) => l.status === "success").length,
        failed: monthLogs.filter((l) => l.status === "failed").length,
      });
    }

    const metrics = {
      overview: {
        totalDeliveries,
        activeDeliveries,
        expiredDeliveries,
        revokedDeliveries,
        totalAccesses,
        successfulAccesses,
        failedAccesses,
        failureRate: parseFloat(failureRate.toFixed(2)),
      },
      timeBased: {
        currentMonth: currentMonthLogs.length,
        lastMonth: lastMonthLogs.length,
        avgRetentionDays: parseFloat(avgRetentionDays.toFixed(1)),
      },
      geographic: {
        topLocations,
        uniqueLocations: Object.keys(locationCounts).length,
      },
      actions: {
        distribution: actionCounts,
      },
      autoDestruction: {
        total: autoDestructed,
        percentage:
          totalDeliveries > 0 ? parseFloat(((autoDestructed / totalDeliveries) * 100).toFixed(1)) : 0,
      },
      trend: monthlyTrend,
    };

    console.log("[API] Compliance metrics calculated successfully");

    return NextResponse.json(
      {
        success: true,
        metrics,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Unexpected error fetching compliance metrics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getEmptyMetrics() {
  return {
    overview: {
      totalDeliveries: 0,
      activeDeliveries: 0,
      expiredDeliveries: 0,
      revokedDeliveries: 0,
      totalAccesses: 0,
      successfulAccesses: 0,
      failedAccesses: 0,
      failureRate: 0,
    },
    timeBased: {
      currentMonth: 0,
      lastMonth: 0,
      avgRetentionDays: 0,
    },
    geographic: {
      topLocations: [],
      uniqueLocations: 0,
    },
    actions: {
      distribution: {},
    },
    autoDestruction: {
      total: 0,
      percentage: 0,
    },
    trend: [],
  };
}
