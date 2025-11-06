import { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@shared/lib/logger";
import {
  OrganizationSettings,
  OrganizationSettingsUpdate,
  DeliveryValidationResult,
  DeliveryLimits,
  AIComplianceConfig,
  DEFAULT_ORGANIZATION_SETTINGS,
} from "../types/settings.interface";
import { camelToSnake, snakeToCamel } from "@shared/utils/case-converter";

export class OrganizationSettingsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get organization settings
   */
  async getSettings(organizationId: string): Promise<OrganizationSettings | null> {
    try {
      const { data, error } = await this.supabase
        .from("organization_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      if (error) {
        logger.error({ error, organizationId }, "Failed to get organization settings");
        return null;
      }

      if (!data) {
        // Create default settings if none exist
        return await this.createDefaultSettings(organizationId);
      }

      return this.mapToOrganizationSettings(data);
    } catch (error) {
      logger.error({ error, organizationId }, "Error getting organization settings");
      return null;
    }
  }

  /**
   * Create default settings for a new organization
   */
  async createDefaultSettings(organizationId: string): Promise<OrganizationSettings> {
    const { data, error } = await this.supabase
      .from("organization_settings")
      .insert({
        organization_id: organizationId,
        ...this.mapToSnakeCase(DEFAULT_ORGANIZATION_SETTINGS),
      })
      .select()
      .single();

    if (error) {
      logger.error({ error, organizationId }, "Failed to create default settings");
      throw new Error("Failed to create organization settings");
    }

    return this.mapToOrganizationSettings(data);
  }

  /**
   * Update organization settings
   */
  async updateSettings(
    organizationId: string,
    updates: OrganizationSettingsUpdate,
    updatedBy: string
  ): Promise<OrganizationSettings> {
    const { data, error } = await this.supabase
      .from("organization_settings")
      .update({
        ...this.mapToSnakeCase(updates),
        updated_by: updatedBy,
      })
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      logger.error({ error, organizationId }, "Failed to update organization settings");
      throw new Error("Failed to update organization settings");
    }

    logger.info({ organizationId, updatedBy }, "Organization settings updated");

    return this.mapToOrganizationSettings(data);
  }

  /**
   * Get delivery limits for an organization
   */
  async getDeliveryLimits(organizationId: string): Promise<DeliveryLimits> {
    const settings = await this.getSettings(organizationId);

    if (!settings) {
      return {
        maxViews: { min: 1, max: 1000, default: 10 },
        maxDownloads: { min: 1, max: 100, default: 5 },
        expirationHours: { min: 1, max: 720, default: 24 },
      };
    }

    return {
      maxViews: {
        min: 1,
        max: settings.maxViewsLimit,
        default: settings.defaultMaxViews,
      },
      maxDownloads: {
        min: 1,
        max: settings.maxDownloadsLimit,
        default: settings.defaultMaxDownloads,
      },
      expirationHours: {
        min: settings.minExpirationHoursLimit,
        max: settings.maxExpirationHoursLimit,
        default: settings.defaultExpirationHours,
      },
    };
  }

  /**
   * Get AI compliance configuration
   */
  async getAIComplianceConfig(organizationId: string): Promise<AIComplianceConfig> {
    const settings = await this.getSettings(organizationId);

    if (!settings) {
      return {
        enabled: false,
        provider: "gemini",
        scanTypes: {
          pii: true,
          phi: true,
          financial: true,
          codeSecrets: true,
          imagesOcr: false,
        },
        regulations: ["GDPR", "HIPAA", "CCPA"],
        behavior: {
          blockOnCritical: false,
          alertOnHigh: true,
          alertOnMedium: false,
        },
        limits: {
          maxScansPerMonth: null,
          timeoutSeconds: 30,
        },
      };
    }

    return {
      enabled: settings.aiComplianceEnabled,
      provider: settings.aiProvider,
      scanTypes: {
        pii: settings.aiScanPii,
        phi: settings.aiScanPhi,
        financial: settings.aiScanFinancial,
        codeSecrets: settings.aiScanCodeSecrets,
        imagesOcr: settings.aiScanImagesOcr,
      },
      regulations: settings.aiRegulations,
      behavior: {
        blockOnCritical: settings.aiBlockOnCritical,
        alertOnHigh: settings.aiAlertOnHigh,
        alertOnMedium: settings.aiAlertOnMedium,
      },
      limits: {
        maxScansPerMonth: settings.aiMaxScansPerMonth,
        timeoutSeconds: settings.aiScanTimeoutSeconds,
      },
    };
  }

  /**
   * Validate delivery parameters against organization limits
   */
  async validateDeliveryLimits(
    organizationId: string,
    maxViews: number,
    maxDownloads: number,
    expirationHours: number
  ): Promise<DeliveryValidationResult> {
    const { data, error } = await this.supabase.rpc("validate_delivery_limits", {
      org_id: organizationId,
      requested_max_views: maxViews,
      requested_max_downloads: maxDownloads,
      requested_expiration_hours: expirationHours,
    });

    if (error) {
      logger.error({ error, organizationId }, "Failed to validate delivery limits");
      return {
        valid: false,
        errorMessage: "Failed to validate delivery limits",
      };
    }

    return data[0] as DeliveryValidationResult;
  }

  /**
   * Check if file type is allowed
   */
  async isFileTypeAllowed(
    organizationId: string,
    mimeType: string,
    filename: string
  ): Promise<boolean> {
    const settings = await this.getSettings(organizationId);

    if (!settings) {
      return true; // Default allow
    }

    // Check blocked extensions
    const fileExtension = filename.split(".").pop()?.toLowerCase();
    if (
      fileExtension &&
      settings.blockedFileExtensions.includes(`.${fileExtension}`)
    ) {
      return false;
    }

    // Check allowed MIME types
    if (settings.allowedMimeTypes.length === 0) {
      return true; // No restrictions
    }

    return settings.allowedMimeTypes.some((allowed) => {
      if (allowed.endsWith("/*")) {
        // Wildcard match (e.g., "image/*")
        const prefix = allowed.slice(0, -2);
        return mimeType.startsWith(prefix);
      }
      return allowed === mimeType;
    });
  }

  /**
   * Check if file size is within limits
   */
  async isFileSizeAllowed(
    organizationId: string,
    fileSizeBytes: number
  ): Promise<boolean> {
    const settings = await this.getSettings(organizationId);

    if (!settings) {
      return fileSizeBytes <= 314572800; // Default 300MB
    }

    return fileSizeBytes <= settings.maxFileSizeBytes;
  }

  /**
   * Check if AI compliance should run for this delivery
   */
  async shouldRunAICompliance(organizationId: string): Promise<boolean> {
    const settings = await this.getSettings(organizationId);

    if (!settings || !settings.aiComplianceEnabled) {
      return false;
    }

    // Check monthly limit if set
    if (settings.aiMaxScansPerMonth !== null) {
      const { data, error } = await this.supabase
        .from("compliance_scans")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .gte(
          "scanned_at",
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        );

      if (error) {
        logger.error({ error, organizationId }, "Failed to check scan count");
        return false;
      }

      const scanCount = data || 0;
      if (scanCount >= settings.aiMaxScansPerMonth) {
        logger.warn(
          { organizationId, scanCount, limit: settings.aiMaxScansPerMonth },
          "Monthly AI scan limit reached"
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Map database row to OrganizationSettings
   */
  private mapToOrganizationSettings(data: any): OrganizationSettings {
    return {
      id: data.id,
      organizationId: data.organization_id,
      defaultMaxViews: data.default_max_views,
      defaultMaxDownloads: data.default_max_downloads,
      defaultExpirationHours: data.default_expiration_hours,
      defaultRequireAuthentication: data.default_require_authentication,
      maxViewsLimit: data.max_views_limit,
      maxDownloadsLimit: data.max_downloads_limit,
      maxExpirationHoursLimit: data.max_expiration_hours_limit,
      minExpirationHoursLimit: data.min_expiration_hours_limit,
      maxFileSizeBytes: data.max_file_size_bytes,
      allowedMimeTypes: data.allowed_mime_types || [],
      blockedFileExtensions: data.blocked_file_extensions || [],
      aiComplianceEnabled: data.ai_compliance_enabled,
      aiProvider: data.ai_provider,
      aiScanPii: data.ai_scan_pii,
      aiScanPhi: data.ai_scan_phi,
      aiScanFinancial: data.ai_scan_financial,
      aiScanCodeSecrets: data.ai_scan_code_secrets,
      aiScanImagesOcr: data.ai_scan_images_ocr,
      aiRegulations: data.ai_regulations || [],
      aiBlockOnCritical: data.ai_block_on_critical,
      aiAlertOnHigh: data.ai_alert_on_high,
      aiAlertOnMedium: data.ai_alert_on_medium,
      aiMaxScansPerMonth: data.ai_max_scans_per_month,
      aiScanTimeoutSeconds: data.ai_scan_timeout_seconds,
      allowPasswordProtection: data.allow_password_protection,
      requireRecipientVerification: data.require_recipient_verification,
      allowAnonymousDelivery: data.allow_anonymous_delivery,
      requireAccessCode: data.require_access_code,
      accessCodeExpirationMinutes: data.access_code_expiration_minutes,
      maxAccessCodeAttempts: data.max_access_code_attempts,
      enableEmailWhitelist: data.enable_email_whitelist,
      enableEmailBlacklist: data.enable_email_blacklist,
      enableIpWhitelist: data.enable_ip_whitelist,
      enableIpBlacklist: data.enable_ip_blacklist,
      enableDomainRestriction: data.enable_domain_restriction,
      enableAuditTrail: data.enable_audit_trail,
      enableDigitalSignatures: data.enable_digital_signatures,
      enableCustodyChain: data.enable_custody_chain,
      retentionPolicyDays: data.retention_policy_days,
      autoDeleteOnExpiration: data.auto_delete_on_expiration,
      notifyOnDeliveryView: data.notify_on_delivery_view,
      notifyOnDeliveryDownload: data.notify_on_delivery_download,
      notifyOnDeliveryExpired: data.notify_on_delivery_expired,
      notifyOnHighRiskContent: data.notify_on_high_risk_content,
      notifyOnAccessDenied: data.notify_on_access_denied,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    };
  }

  /**
   * Convert camelCase to snake_case for database
   */
  private mapToSnakeCase(obj: any): any {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      result[snakeKey] = value;
    }
    return result;
  }
}
