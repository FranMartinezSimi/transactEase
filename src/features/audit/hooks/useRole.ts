"use client";

import { useEffect, useState } from "react";
import { createClient } from "@shared/lib/supabase/client";

export type UserRole = "owner" | "admin" | "member";

export interface RolePermissions {
  canViewAllDeliveries: boolean;
  canViewAuditLogs: boolean;
  canManageTeam: boolean;
  canManageOrganization: boolean;
  canDeleteAnyDelivery: boolean;
  canExportData: boolean;
  canViewForensics: boolean;
  canViewCompliance: boolean;
}

export function useRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions>({
    canViewAllDeliveries: false,
    canViewAuditLogs: false,
    canManageTeam: false,
    canManageOrganization: false,
    canDeleteAnyDelivery: false,
    canExportData: false,
    canViewForensics: false,
    canViewCompliance: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRole();
  }, []);

  async function fetchRole() {
    try {
      setLoading(true);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("[useRole] Error fetching role:", profileError);
        setError(profileError.message);
        setLoading(false);
        return;
      }

      const userRole = profile?.role as UserRole;
      setRole(userRole);

      // Set permissions based on role
      const rolePermissions = getRolePermissions(userRole);
      setPermissions(rolePermissions);

      setLoading(false);
    } catch (err) {
      console.error("[useRole] Unexpected error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }

  return {
    role,
    permissions,
    loading,
    error,
    isOwner: role === "owner",
    isAdmin: role === "admin" || role === "owner",
    isMember: role === "member",
    refetch: fetchRole,
  };
}

/**
 * Get permissions based on user role
 */
function getRolePermissions(role: UserRole | null): RolePermissions {
  if (!role) {
    return {
      canViewAllDeliveries: false,
      canViewAuditLogs: false,
      canManageTeam: false,
      canManageOrganization: false,
      canDeleteAnyDelivery: false,
      canExportData: false,
      canViewForensics: false,
      canViewCompliance: false,
    };
  }

  switch (role) {
    case "owner":
      return {
        canViewAllDeliveries: true,
        canViewAuditLogs: true,
        canManageTeam: true,
        canManageOrganization: true,
        canDeleteAnyDelivery: true,
        canExportData: true,
        canViewForensics: true,
        canViewCompliance: true,
      };

    case "admin":
      return {
        canViewAllDeliveries: true,
        canViewAuditLogs: true,
        canManageTeam: true,
        canManageOrganization: false, // Only owner can manage org settings
        canDeleteAnyDelivery: true,
        canExportData: true,
        canViewForensics: true,
        canViewCompliance: true,
      };

    case "member":
      return {
        canViewAllDeliveries: false, // Only own deliveries
        canViewAuditLogs: true, // Only own logs
        canManageTeam: false,
        canManageOrganization: false,
        canDeleteAnyDelivery: false, // Only own deliveries
        canExportData: false,
        canViewForensics: false,
        canViewCompliance: false,
      };

    default:
      return {
        canViewAllDeliveries: false,
        canViewAuditLogs: false,
        canManageTeam: false,
        canManageOrganization: false,
        canDeleteAnyDelivery: false,
        canExportData: false,
        canViewForensics: false,
        canViewCompliance: false,
      };
  }
}
