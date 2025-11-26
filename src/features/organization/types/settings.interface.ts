/**
 * Organization Settings Types
 * Centralized configuration for organization-level settings
 */

export interface OrganizationSettings {
  id: string;
  organizationId: string;

  // ===== DELIVERY DEFAULTS =====
  defaultMaxViews: number;
  defaultMaxDownloads: number;
  defaultExpirationHours: number;
  defaultRequireAuthentication: boolean;

  // ===== DELIVERY LIMITS =====
  maxViewsLimit: number;
  maxDownloadsLimit: number;
  maxExpirationHoursLimit: number;
  minExpirationHoursLimit: number;

  // ===== FILE RESTRICTIONS =====
  maxFileSizeBytes: number;
  allowedMimeTypes: string[];
  blockedFileExtensions: string[];

  // ===== AI COMPLIANCE SETTINGS =====
  aiComplianceEnabled: boolean;
  aiProvider: AIProvider;
  aiScanPii: boolean;
  aiScanPhi: boolean;
  aiScanFinancial: boolean;
  aiScanCodeSecrets: boolean;
  aiScanImagesOcr: boolean;
  aiRegulations: ComplianceRegulation[];
  aiBlockOnCritical: boolean;
  aiAlertOnHigh: boolean;
  aiAlertOnMedium: boolean;
  aiMaxScansPerMonth: number | null;
  aiScanTimeoutSeconds: number;

  // ===== SECURITY FEATURES =====
  allowPasswordProtection: boolean;
  requireRecipientVerification: boolean;
  allowAnonymousDelivery: boolean;
  requireAccessCode: boolean;
  accessCodeExpirationMinutes: number;
  maxAccessCodeAttempts: number;

  // ===== ACCESS CONTROL =====
  enableEmailWhitelist: boolean;
  enableEmailBlacklist: boolean;
  enableIpWhitelist: boolean;
  enableIpBlacklist: boolean;
  enableDomainRestriction: boolean;

  // ===== AUDIT & COMPLIANCE =====
  enableAuditTrail: boolean;
  enableDigitalSignatures: boolean;
  enableCustodyChain: boolean;
  retentionPolicyDays: number | null;
  autoDeleteOnExpiration: boolean;

  // ===== NOTIFICATIONS =====
  notifyOnDeliveryView: boolean;
  notifyOnDeliveryDownload: boolean;
  notifyOnDeliveryExpired: boolean;
  notifyOnHighRiskContent: boolean;
  notifyOnAccessDenied: boolean;

  // ===== METADATA =====
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export type AIProvider = "gemini" | "openai" | "claude";

export type ComplianceRegulation = "GDPR" | "HIPAA" | "CCPA" | "SOC2" | "ISO27001";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface DeliveryValidationResult {
  valid: boolean;
  errorMessage?: string;
}

export interface OrganizationSettingsUpdate {
  // Delivery defaults
  defaultMaxViews?: number;
  defaultMaxDownloads?: number;
  defaultExpirationHours?: number;
  defaultRequireAuthentication?: boolean;

  // Delivery limits
  maxViewsLimit?: number;
  maxDownloadsLimit?: number;
  maxExpirationHoursLimit?: number;
  minExpirationHoursLimit?: number;

  // File restrictions
  maxFileSizeBytes?: number;
  allowedMimeTypes?: string[];
  blockedFileExtensions?: string[];

  // AI Compliance
  aiComplianceEnabled?: boolean;
  aiProvider?: AIProvider;
  aiScanPii?: boolean;
  aiScanPhi?: boolean;
  aiScanFinancial?: boolean;
  aiScanCodeSecrets?: boolean;
  aiScanImagesOcr?: boolean;
  aiRegulations?: ComplianceRegulation[];
  aiBlockOnCritical?: boolean;
  aiAlertOnHigh?: boolean;
  aiAlertOnMedium?: boolean;
  aiMaxScansPerMonth?: number | null;
  aiScanTimeoutSeconds?: number;

  // Security features
  allowPasswordProtection?: boolean;
  requireRecipientVerification?: boolean;
  allowAnonymousDelivery?: boolean;
  requireAccessCode?: boolean;
  accessCodeExpirationMinutes?: number;
  maxAccessCodeAttempts?: number;

  // Access control
  enableEmailWhitelist?: boolean;
  enableEmailBlacklist?: boolean;
  enableIpWhitelist?: boolean;
  enableIpBlacklist?: boolean;
  enableDomainRestriction?: boolean;

  // Audit & Compliance
  enableAuditTrail?: boolean;
  enableDigitalSignatures?: boolean;
  enableCustodyChain?: boolean;
  retentionPolicyDays?: number | null;
  autoDeleteOnExpiration?: boolean;

  // Notifications
  notifyOnDeliveryView?: boolean;
  notifyOnDeliveryDownload?: boolean;
  notifyOnDeliveryExpired?: boolean;
  notifyOnHighRiskContent?: boolean;
  notifyOnAccessDenied?: boolean;

  updatedBy?: string;
}

export interface DeliveryLimits {
  maxViews: {
    min: number;
    max: number;
    default: number;
  };
  maxDownloads: {
    min: number;
    max: number;
    default: number;
  };
  expirationHours: {
    min: number;
    max: number;
    default: number;
  };
}

export interface AIComplianceConfig {
  enabled: boolean;
  provider: AIProvider;
  scanTypes: {
    pii: boolean;
    phi: boolean;
    financial: boolean;
    codeSecrets: boolean;
    imagesOcr: boolean;
  };
  regulations: ComplianceRegulation[];
  behavior: {
    blockOnCritical: boolean;
    alertOnHigh: boolean;
    alertOnMedium: boolean;
  };
  limits: {
    maxScansPerMonth: number | null;
    timeoutSeconds: number;
  };
}

// Defaults for new organizations
export const DEFAULT_ORGANIZATION_SETTINGS: Partial<OrganizationSettings> = {
  // Delivery defaults
  defaultMaxViews: 10,
  defaultMaxDownloads: 5,
  defaultExpirationHours: 24,
  defaultRequireAuthentication: true,

  // Delivery limits
  maxViewsLimit: 1000,
  maxDownloadsLimit: 100,
  maxExpirationHoursLimit: 720, // 30 days
  minExpirationHoursLimit: 1,

  // File restrictions
  maxFileSizeBytes: 314572800, // 300MB
  blockedFileExtensions: [".exe", ".bat", ".sh", ".cmd"],

  // AI Compliance (disabled by default)
  aiComplianceEnabled: false,
  aiProvider: "gemini",
  aiScanPii: true,
  aiScanPhi: true,
  aiScanFinancial: true,
  aiScanCodeSecrets: true,
  aiScanImagesOcr: false,
  aiRegulations: ["GDPR", "HIPAA", "CCPA"],
  aiBlockOnCritical: false,
  aiAlertOnHigh: true,
  aiAlertOnMedium: false,
  aiMaxScansPerMonth: null,
  aiScanTimeoutSeconds: 30,

  // Security features
  allowPasswordProtection: true,
  requireRecipientVerification: true,
  allowAnonymousDelivery: false,
  requireAccessCode: true,
  accessCodeExpirationMinutes: 15,
  maxAccessCodeAttempts: 3,

  // Access control (all disabled by default)
  enableEmailWhitelist: false,
  enableEmailBlacklist: false,
  enableIpWhitelist: false,
  enableIpBlacklist: false,
  enableDomainRestriction: false,

  // Audit & Compliance
  enableAuditTrail: true,
  enableDigitalSignatures: false,
  enableCustodyChain: false,
  retentionPolicyDays: null,
  autoDeleteOnExpiration: true,

  // Notifications
  notifyOnDeliveryView: false,
  notifyOnDeliveryDownload: true,
  notifyOnDeliveryExpired: false,
  notifyOnHighRiskContent: true,
  notifyOnAccessDenied: true,
};
