import { Delivery } from "@/hooks/useDeliveries";

export interface DeliveryWithFiles extends Delivery {
  files: File[];
  sender?: {
    fullName: string;
    email: string;
  };
  organization?: {
    name: string;
  };
}

export interface DeliveryFilters {
  organizationId?: string;
  senderId?: string;
  status?: "active" | "expired" | "revoked";
  recipientEmail?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface IDeliveryRepository {
  findById(id: string): Promise<DeliveryWithFiles | null>;
  findMany(filters: DeliveryFilters): Promise<DeliveryWithFiles[]>;
  findByOrganization(organizationId: string): Promise<DeliveryWithFiles[]>;
  findBySender(senderId: string): Promise<DeliveryWithFiles[]>;
  create(data: CreateDeliveryData): Promise<Delivery>;
  updateStatus(
    id: string,
    status: "active" | "expired" | "revoked"
  ): Promise<Delivery>;
  incrementViews(id: string): Promise<Delivery>;
  incrementDownloads(id: string): Promise<Delivery>;
  delete(id: string): Promise<void>;
  count(filters: DeliveryFilters): Promise<number>;
  getStats(organizationId: string): Promise<DeliveryStats>;
}

export interface CreateDeliveryData {
  senderId: string;
  organizationId: string;
  title: string;
  message?: string;
  recipientEmail: string;
  expiresAt: Date;
  maxViews: number;
  maxDownloads: number;
}

export interface DeliveryStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  thisMonth: number;
}
