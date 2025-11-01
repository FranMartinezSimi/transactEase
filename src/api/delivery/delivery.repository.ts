import { SupabaseClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import {
  IDeliveryRepository,
  CreateDeliveryData,
  DeliveryStats,
  DeliveryWithFiles,
  DeliveryFilters,
} from "./delivery.interface";

export class DeliveryRepository implements IDeliveryRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findBySender(senderId: string): Promise<DeliveryWithFiles[]> {
    const { data, error } = await this.supabase
      .from("deliveries")
      .select(
        `
        *,
        delivery_files:delivery_files(*),
        sender:profiles!deliveries_sender_id_fkey ( full_name, email ),
        organization:organizations!deliveries_organization_id_fkey ( name )
      `
      )
      .eq("sender_id", senderId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[DeliveryRepository] Error finding by sender:", error);
      return [];
    }
    return (data || []).map((d: any) => this.toDeliveryWithFiles(d));
  }

  async create(data: CreateDeliveryData): Promise<DeliveryWithFiles> {
    const payload = {
      id: crypto.randomUUID(),
      sender_id: data.senderId,
      organization_id: data.organizationId,
      title: data.title,
      message: data.message ?? null,
      recipient_email: data.recipientEmail,
      expires_at: data.expiresAt.toISOString(),
      max_views: data.maxViews,
      max_downloads: data.maxDownloads,
      updated_at: new Date().toISOString(),
    };
    const { data: inserted, error } = await this.supabase
      .from("deliveries")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      console.error("[DeliveryRepository] Error creating delivery:", error);
      throw error;
    }
    return inserted as unknown as DeliveryWithFiles;
  }
  updateStatus(
    id: string,
    status: "active" | "expired" | "revoked"
  ): Promise<DeliveryWithFiles> {
    return this.updateDelivery(id, { status });
  }
  incrementViews(id: string): Promise<DeliveryWithFiles> {
    return this.incrementField(id, "current_views");
  }
  incrementDownloads(id: string): Promise<DeliveryWithFiles> {
    return this.incrementField(id, "current_downloads");
  }

  async delete(id: string): Promise<void> {
    // Eliminar archivos asociados primero para evitar errores de FK
    const { error: filesError } = await this.supabase
      .from("delivery_files")
      .delete()
      .eq("delivery_id", id);
    if (filesError) {
      console.error(
        "[DeliveryRepository] Error deleting delivery files:",
        filesError
      );
      throw filesError;
    }
    const { error } = await this.supabase
      .from("deliveries")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("[DeliveryRepository] Error deleting delivery:", error);
      throw error;
    }
  }
  async count(filters: DeliveryFilters): Promise<number> {
    let query = this.supabase
      .from("deliveries")
      .select("id", { count: "exact", head: true });
    query = this.applyFilters(query, filters);
    const { count, error } = await query;
    if (error) {
      console.error("[DeliveryRepository] Error counting deliveries:", error);
      return 0;
    }
    return count ?? 0;
  }
  async getStats(organizationId: string): Promise<DeliveryStats> {
    const base = this.supabase
      .from("deliveries")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    const [
      { count: total },
      { count: active },
      { count: expired },
      { count: revoked },
    ] = await Promise.all([
      base,
      base.eq("status", "active"),
      base.eq("status", "expired"),
      base.eq("status", "revoked"),
    ]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count: thisMonth } = await this.supabase
      .from("deliveries")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", startOfMonth.toISOString());

    return {
      total: total ?? 0,
      active: active ?? 0,
      expired: expired ?? 0,
      revoked: revoked ?? 0,
      thisMonth: thisMonth ?? 0,
    };
  }

  async findById(id: string): Promise<DeliveryWithFiles | null> {
    const { data, error } = await this.supabase
      .from("deliveries")
      .select(
        `
        *,
        delivery_files:delivery_files(*),
        sender:profiles!deliveries_sender_id_fkey ( full_name, email ),
        organization:organizations!deliveries_organization_id_fkey ( name )
      `
      )
      .eq("id", id)
      .single();
    if (error) {
      console.error(
        "[DeliveryRepository] Error finding delivery by id:",
        JSON.stringify(error, null, 2)
      );
      console.error("[DeliveryRepository] Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }
    return this.toDeliveryWithFiles(data as any);
  }

  async findMany(filters: DeliveryFilters): Promise<DeliveryWithFiles[]> {
    let query = this.supabase
      .from("deliveries")
      .select(
        `
        *,
        delivery_files:delivery_files(*),
        sender:profiles!deliveries_sender_id_fkey ( full_name, email ),
        organization:organizations!deliveries_organization_id_fkey ( name )
      `
      )
      .order("created_at", { ascending: false });
    query = this.applyFilters(query, filters);
    const { data, error } = await query;
    if (error) {
      console.error("[DeliveryRepository] Error finding deliveries:", error);
      return [];
    }
    return (data || []).map((d: any) => this.toDeliveryWithFiles(d));
  }

  async findByOrganization(
    organizationId: string
  ): Promise<DeliveryWithFiles[]> {
    const { data, error } = await this.supabase
      .from("deliveries")
      .select(
        `
        *,
        delivery_files:delivery_files(*),
        sender:profiles!deliveries_sender_id_fkey ( full_name, email ),
        organization:organizations!deliveries_organization_id_fkey ( name )
      `
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(
        "[DeliveryRepository] Error finding deliveries by organization:",
        error
      );
      return [];
    }
    return (data || []).map((d: any) => this.toDeliveryWithFiles(d));
  }

  private async incrementField(
    id: string,
    field: "current_views" | "current_downloads"
  ): Promise<DeliveryWithFiles> {
    const { data: current, error: getErr } = await this.supabase
      .from("deliveries")
      .select(`${field}`)
      .eq("id", id)
      .single();
    if (getErr) {
      console.error(`[DeliveryRepository] Error reading ${field}:`, getErr);
      throw getErr;
    }
    const raw = current ? (current as Record<string, unknown>)[field] : 0;
    const base = typeof raw === "number" ? raw : Number(raw) || 0;
    const newValue = base + 1;
    const { data: updated, error } = await this.supabase
      .from("deliveries")
      .update({ [field]: newValue, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      console.error(`[DeliveryRepository] Error incrementing ${field}:`, error);
      throw error;
    }
    return updated as unknown as DeliveryWithFiles;
  }

  private async updateDelivery(
    id: string,
    changes: Record<string, unknown>
  ): Promise<DeliveryWithFiles> {
    const { data, error } = await this.supabase
      .from("deliveries")
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      console.error("[DeliveryRepository] Error updating delivery:", error);
      throw error;
    }
    return data as unknown as DeliveryWithFiles;
  }

  private applyFilters(query: any, filters: DeliveryFilters) {
    let q = query;
    if (filters.organizationId)
      q = q.eq("organization_id", filters.organizationId);
    if (filters.senderId) q = q.eq("sender_id", filters.senderId);
    if (filters.status) q = q.eq("status", filters.status);
    if (filters.recipientEmail)
      q = q.ilike("recipient_email", `%${filters.recipientEmail}%`);
    if (filters.createdAfter)
      q = q.gte("created_at", filters.createdAfter.toISOString());
    if (filters.createdBefore)
      q = q.lte("created_at", filters.createdBefore.toISOString());
    return q;
  }

  private toDeliveryWithFiles(row: any): DeliveryWithFiles {
    return {
      id: row.id,
      title: row.title,
      message: row.message ?? undefined,
      recipient_email: row.recipient_email,
      expires_at: row.expires_at,
      current_views: row.current_views ?? 0,
      max_views: row.max_views,
      current_downloads: row.current_downloads ?? 0,
      max_downloads: row.max_downloads,
      status: row.status,
      created_at: row.created_at,
      files: Array.isArray(row.delivery_files) ? row.delivery_files : [],
      sender: row.sender
        ? { fullName: row.sender.full_name, email: row.sender.email }
        : undefined,
      organization: row.organization
        ? { name: row.organization.name }
        : undefined,
    } as unknown as DeliveryWithFiles;
  }
}
