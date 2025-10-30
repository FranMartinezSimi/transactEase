"use server";

import {
  IDeliveryRepository,
  CreateDeliveryData,
  DeliveryStats,
  DeliveryWithFiles,
  DeliveryFilters,
} from "./delivery.interface";

export class DeliveryService {
  private readonly deliveryRepository: IDeliveryRepository;

  constructor(deliveryRepository: IDeliveryRepository) {
    this.deliveryRepository = deliveryRepository;
  }

  async sendDelivery(delivery: CreateDeliveryData) {
    const newDelivery = await this.deliveryRepository.create(delivery);
    if (!newDelivery) {
      throw new Error("Failed to create delivery");
    }
    return newDelivery;
  }

  async getDeliveryByOrganization(organizationId: string) {
    const deliveries =
      await this.deliveryRepository.findByOrganization(organizationId);
    if (!deliveries) {
      throw new Error("Failed to get deliveries");
    }
    return deliveries;
  }

  async getDeliveryBySender(senderId: string) {
    return this.deliveryRepository.findBySender(senderId);
  }

  async getDeliveryCount(filters: DeliveryFilters) {
    return this.deliveryRepository.count(filters);
  }

  async updateDeliveryStatus(
    id: string,
    status: "active" | "expired" | "revoked"
  ) {
    return this.deliveryRepository.updateStatus(id, status);
  }

  async incrementDeliveryViews(id: string) {
    return this.deliveryRepository.incrementViews(id);
  }

  async incrementDeliveryDownloads(id: string) {
    return this.deliveryRepository.incrementDownloads(id);
  }

  async deleteDelivery(id: string) {
    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) {
      throw new Error("Delivery not found");
    }
    await this.deliveryRepository.delete(id);
    return delivery;
  }

  async validateAccess(
    id: string,
    token?: string,
    emailProvided?: string
  ): Promise<boolean> {
    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) return false;

    if (emailProvided) {
      const provided = emailProvided.trim().toLowerCase();
      const recipient = (delivery.recipient_email || "").trim().toLowerCase();
      if (provided && recipient && provided === recipient) return true;
    }

    if (token && token.length > 0) {
      // Extender aquí si manejas tokens de acceso a delivery
      return true;
    }

    return false;
  }

  async getDeliveryById(id: string) {
    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) {
      throw new Error("Delivery not found");
    }
    return delivery;
  }

  async getDeliveryFiles(id: string) {
    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) {
      throw new Error("Delivery not found");
    }
    return delivery.files;
  }

  async getDeliveryForViewer(
    id: string,
    viewerEmail?: string | null
  ): Promise<DeliveryWithFiles | null> {
    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) return null;

    const isRecipient = viewerEmail
      ? viewerEmail.trim().toLowerCase() ===
        (delivery.recipient_email || "").trim().toLowerCase()
      : false;

    if (!isRecipient && viewerEmail) {
      return {
        ...delivery,
        title: "",
        message: undefined,
        recipient_email: "",
        files: [],
        current_views: 0,
        current_downloads: 0,
        max_views: 0,
        max_downloads: 0,
      } as DeliveryWithFiles;
    }

    return delivery;
  }
}
