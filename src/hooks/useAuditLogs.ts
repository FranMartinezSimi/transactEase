"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface AuditLog {
  id: string;
  timestamp: Date;
  action: "view" | "download" | "access_attempt" | "expired" | "code_verified" | "code_requested" | "revoked";
  deliveryTitle: string;
  deliveryId: string;
  recipientEmail: string;
  recipientName?: string;
  senderEmail: string;
  senderName?: string;
  ip: string;
  location: string;
  userAgent?: string;
  status: "success" | "failed" | "expired" | "revoked";
  details: string;
  metadata?: Record<string, any>;
}

interface UseAuditLogsOptions {
  dateFrom?: Date;
  dateTo?: Date;
  searchEmail?: string;
  actionFilter?: string;
  senderFilter?: string;
  isAdmin?: boolean;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [
    options.dateFrom,
    options.dateTo,
    options.searchEmail,
    options.actionFilter,
    options.senderFilter,
    options.isAdmin,
  ]);

  async function fetchLogs() {
    try {
      setLoading(true);
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLogs([]);
        setLoading(false);
        return;
      }

      // Get user's organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id, role")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) {
        setLogs([]);
        setLoading(false);
        return;
      }

      // Build query
      // Note: access_logs table uses 'timestamp' column, not 'created_at'
      let query = supabase
        .from("access_logs")
        .select(`
          *,
          deliveries!access_logs_delivery_id_fkey (
            id,
            title,
            recipient_email,
            sender_id,
            organization_id,
            status,
            profiles!deliveries_sender_id_fkey (
              full_name,
              email
            )
          )
        `)
        .order("timestamp", { ascending: false });

      // If not admin, only show logs for own deliveries
      const isAdmin = profile.role === "admin" || profile.role === "owner";

      if (!isAdmin) {
        // Get logs for deliveries sent by this user
        const { data: userDeliveries } = await supabase
          .from("deliveries")
          .select("id")
          .eq("sender_id", user.id);

        if (userDeliveries && userDeliveries.length > 0) {
          const deliveryIds = userDeliveries.map(d => d.id);
          query = query.in("delivery_id", deliveryIds);
        } else {
          setLogs([]);
          setLoading(false);
          return;
        }
      }
      // Note: No filter by organization for admins, the join will handle it

      // Apply filters
      if (options.dateFrom) {
        query = query.gte("timestamp", options.dateFrom.toISOString());
      }
      if (options.dateTo) {
        query = query.lte("timestamp", options.dateTo.toISOString());
      }
      if (options.actionFilter && options.actionFilter !== "all") {
        query = query.eq("action", options.actionFilter);
      }

      const { data: logsData, error: logsError } = await query;

      if (logsError) {
        console.error("[useAuditLogs] Error fetching logs:", logsError);
        setError(logsError.message);
        setLogs([]);
        setLoading(false);
        return;
      }

      // Transform data
      const transformedLogs: AuditLog[] = (logsData || [])
        .filter((log: any) => log.deliveries) // Filter out logs with deleted deliveries
        .map((log: any) => {
          const delivery = log.deliveries;
          const sender = delivery.profiles;

          // Parse location from metadata or use IP
          let location = "Unknown Location";
          if (log.metadata?.location) {
            location = log.metadata.location;
          }

          // Determine status
          let status: "success" | "failed" | "expired" | "revoked" = log.success ? "success" : "failed";
          if (delivery.status === "expired") status = "expired";
          if (delivery.status === "revoked") status = "revoked";

          // Generate details message
          const viewerType = log.metadata?.viewer_type;
          const viewerLabel = viewerType === "recipient" ? "Recipient" : viewerType === "sender" ? "Sender" : "";

          let details = "";
          switch (log.action) {
            case "view":
              details = viewerLabel ? `${viewerLabel} viewed document` : `Document viewed`;
              break;
            case "download":
              details = viewerLabel ? `${viewerLabel} downloaded file` : `File downloaded`;
              break;
            case "code_verified":
              details = viewerLabel ? `${viewerLabel} verified access code` : `Access code verified successfully`;
              break;
            case "code_requested":
              details = `Access code requested`;
              break;
            case "access_attempt":
              details = log.success ? `Access granted` : `Access denied`;
              break;
            default:
              details = log.action;
          }

          if (log.metadata?.details) {
            details = log.metadata.details;
          }

          return {
            id: log.id,
            timestamp: new Date(log.timestamp),
            action: log.action as AuditLog["action"],
            deliveryTitle: delivery.title,
            deliveryId: delivery.id,
            recipientEmail: delivery.recipient_email,
            recipientName: delivery.recipient_email.split("@")[0], // Basic name extraction
            senderEmail: sender?.email || "Unknown",
            senderName: sender?.full_name || sender?.email || "Unknown",
            ip: log.ip_address,
            location,
            userAgent: log.user_agent,
            status,
            details,
            metadata: log.metadata,
          };
        });

      // Apply email filter (client-side for simplicity)
      let filteredLogs = transformedLogs;
      if (options.searchEmail) {
        filteredLogs = filteredLogs.filter((log) =>
          log.recipientEmail.toLowerCase().includes(options.searchEmail!.toLowerCase()) ||
          log.senderEmail.toLowerCase().includes(options.searchEmail!.toLowerCase())
        );
      }

      // Apply sender filter
      if (options.senderFilter && options.senderFilter !== "all") {
        filteredLogs = filteredLogs.filter((log) => log.senderEmail === options.senderFilter);
      }

      setLogs(filteredLogs);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error("[useAuditLogs] Unexpected error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setLogs([]);
      setLoading(false);
    }
  }

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
  };
}
