import {
  IDeliveryRepository,
  CreateDeliveryData,
  DeliveryStats,
  DeliveryWithFiles,
  DeliveryFilters,
} from "@features/delivery";
import { createContextLogger } from "@shared/lib/logger";

export class DeliveryService {
  private readonly deliveryRepository: IDeliveryRepository;
  private readonly logger;

  constructor(deliveryRepository: IDeliveryRepository) {
    this.deliveryRepository = deliveryRepository;
    this.logger = createContextLogger({ service: "DeliveryService" });
  }

  async sendDelivery(delivery: CreateDeliveryData) {
    const startTime = Date.now();
    const log = this.logger.child({
      operation: "sendDelivery",
      senderId: delivery.senderId,
      organizationId: delivery.organizationId,
      recipientEmail: delivery.recipientEmail,
    });

    try {
      log.debug({ delivery }, "Creating new delivery");
      const newDelivery = await this.deliveryRepository.create(delivery);

      if (!newDelivery) {
        log.error("Failed to create delivery: repository returned null");
        throw new Error("Failed to create delivery");
      }

      const duration = Date.now() - startTime;
      log.info(
        {
          deliveryId: (newDelivery as any).id,
          duration,
        },
        "Delivery created successfully"
      );
      return newDelivery;
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error({ error, duration }, "Failed to create delivery");
      throw error;
    }
  }

  async getDeliveryByOrganization(organizationId: string) {
    const log = this.logger.child({
      operation: "getDeliveryByOrganization",
      organizationId,
    });

    try {
      log.debug("Fetching deliveries for organization");
      const deliveries =
        await this.deliveryRepository.findByOrganization(organizationId);

      if (!deliveries) {
        log.warn("No deliveries found or repository returned null");
        throw new Error("Failed to get deliveries");
      }

      log.info({ count: deliveries.length }, "Deliveries fetched successfully");
      return deliveries;
    } catch (error) {
      log.error({ error }, "Failed to get deliveries by organization");
      throw error;
    }
  }

  async getDeliveryBySender(senderId: string) {
    const log = this.logger.child({
      operation: "getDeliveryBySender",
      senderId,
    });

    try {
      log.debug("Fetching deliveries by sender");
      const deliveries = await this.deliveryRepository.findBySender(senderId);
      log.info({ count: deliveries.length }, "Deliveries fetched successfully");
      return deliveries;
    } catch (error) {
      log.error({ error }, "Failed to get deliveries by sender");
      throw new Error("Failed to get deliveries by sender");
    }
  }

  async getDeliveryCount(filters: DeliveryFilters) {
    const log = this.logger.child({
      operation: "getDeliveryCount",
      filters,
    });

    try {
      log.debug("Counting deliveries");
      const count = await this.deliveryRepository.count(filters);
      log.debug({ count }, "Delivery count retrieved");
      return count;
    } catch (error) {
      log.error({ error }, "Failed to count deliveries");
      throw error;
    }
  }

  async updateDeliveryStatus(
    id: string,
    status: "active" | "expired" | "revoked"
  ) {
    const log = this.logger.child({
      operation: "updateDeliveryStatus",
      deliveryId: id,
      newStatus: status,
    });

    try {
      log.info("Updating delivery status");
      const updated = await this.deliveryRepository.updateStatus(id, status);
      log.info(
        { deliveryId: (updated as any).id },
        "Delivery status updated successfully"
      );
      return updated;
    } catch (error) {
      log.error({ error }, "Failed to update delivery status");
      throw error;
    }
  }

  async incrementDeliveryViews(id: string) {
    const log = this.logger.child({
      operation: "incrementDeliveryViews",
      deliveryId: id,
    });

    try {
      log.debug("Incrementing delivery views");
      const updated = await this.deliveryRepository.incrementViews(id);
      log.info(
        {
          deliveryId: (updated as any).id,
          views: (updated as any).current_views,
        },
        "Delivery views incremented"
      );
      return updated;
    } catch (error) {
      log.error({ error }, "Failed to increment delivery views");
      throw error;
    }
  }

  async incrementDeliveryDownloads(id: string) {
    const log = this.logger.child({
      operation: "incrementDeliveryDownloads",
      deliveryId: id,
    });

    try {
      log.debug("Incrementing delivery downloads");
      const updated = await this.deliveryRepository.incrementDownloads(id);
      log.info(
        {
          deliveryId: (updated as any).id,
          downloads: (updated as any).current_downloads,
        },
        "Delivery downloads incremented"
      );
      return updated;
    } catch (error) {
      log.error({ error }, "Failed to increment delivery downloads");
      throw error;
    }
  }

  async deleteDelivery(id: string) {
    const log = this.logger.child({
      operation: "deleteDelivery",
      deliveryId: id,
    });

    try {
      log.info("Deleting delivery");
      const delivery = await this.deliveryRepository.findById(id);

      if (!delivery) {
        log.warn("Delivery not found for deletion");
        throw new Error("Delivery not found");
      }

      await this.deliveryRepository.delete(id);
      log.info({ deliveryId: id }, "Delivery deleted successfully");
      return delivery;
    } catch (error) {
      log.error({ error }, "Failed to delete delivery");
      throw error;
    }
  }

  async validateAccess(
    id: string,
    token?: string,
    emailProvided?: string
  ): Promise<boolean> {
    const log = this.logger.child({
      operation: "validateAccess",
      deliveryId: id,
      hasToken: !!token,
      hasEmail: !!emailProvided,
    });

    try {
      log.debug("Validating access to delivery");
      const delivery = await this.deliveryRepository.findById(id);

      if (!delivery) {
        log.warn("Delivery not found for access validation");
        return false;
      }

      let hasAccess = false;
      if (emailProvided) {
        const provided = emailProvided.trim().toLowerCase();
        const recipient = (delivery.recipient_email || "").trim().toLowerCase();
        hasAccess = !!provided && !!recipient && provided === recipient;
        if (hasAccess) {
          log.info(
            { method: "email" },
            "Access granted via email verification"
          );
        } else {
          log.debug({ provided, recipient }, "Email mismatch");
        }
      }

      if (!hasAccess && token && token.length > 0) {
        // Extender aquí si manejas tokens de acceso a delivery
        hasAccess = true;
        log.info({ method: "token" }, "Access granted via token");
      }

      if (!hasAccess) {
        log.warn("Access denied: no valid credentials");
      }

      return hasAccess;
    } catch (error) {
      log.error({ error }, "Error during access validation");
      return false;
    }
  }

  async getDeliveryById(id: string) {
    const log = this.logger.child({
      operation: "getDeliveryById",
      deliveryId: id,
    });

    try {
      log.debug("Fetching delivery by ID");
      const delivery = await this.deliveryRepository.findById(id);

      if (!delivery) {
        log.warn("Delivery not found");
        throw new Error("Delivery not found");
      }

      log.debug({ deliveryId: delivery.id }, "Delivery fetched successfully");
      return delivery;
    } catch (error) {
      log.error({ error }, "Failed to get delivery by ID");
      throw error;
    }
  }

  async getDeliveryFiles(id: string) {
    const log = this.logger.child({
      operation: "getDeliveryFiles",
      deliveryId: id,
    });

    try {
      log.debug("Fetching delivery files");
      const delivery = await this.deliveryRepository.findById(id);

      if (!delivery) {
        log.warn("Delivery not found");
        throw new Error("Delivery not found");
      }

      log.debug({ fileCount: delivery.files.length }, "Delivery files fetched");
      return delivery.files;
    } catch (error) {
      log.error({ error }, "Failed to get delivery files");
      throw error;
    }
  }

  async getDeliveryForViewer(
    id: string,
    viewerEmail?: string | null
  ): Promise<DeliveryWithFiles | null> {
    const log = this.logger.child({
      operation: "getDeliveryForViewer",
      deliveryId: id,
      viewerEmail: viewerEmail || "anonymous",
    });

    try {
      log.debug("Fetching delivery for viewer");
      const delivery = await this.deliveryRepository.findById(id);

      if (!delivery) {
        log.debug("Delivery not found");
        return null;
      }

      const isRecipient = viewerEmail
        ? viewerEmail.trim().toLowerCase() ===
          (delivery.recipient_email || "").trim().toLowerCase()
        : false;

      if (!isRecipient && viewerEmail) {
        log.warn(
          {
            viewerEmail,
            recipientEmail: delivery.recipient_email,
          },
          "Non-recipient viewer: masking delivery data"
        );
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

      if (isRecipient) {
        log.info("Recipient viewer: showing full delivery data");
      } else {
        log.debug("Anonymous viewer: showing full delivery data");
      }

      return delivery;
    } catch (error) {
      log.error({ error }, "Failed to get delivery for viewer");
      throw error;
    }
  }
}
