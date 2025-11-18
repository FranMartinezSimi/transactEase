/**
 * Audit Feature - Public API
 *
 * Este feature maneja toda la funcionalidad de auditoría:
 * - Logs de acceso y actividad
 * - Permisos y roles
 * - Compliance y reportes de seguridad
 * - Exportación de datos
 */

// Types
export type { AuditLog } from "./hooks/useAuditLogs";
export type { UserRole, RolePermissions } from "./hooks/useRole";

// Hooks
export { useAuditLogs } from "./hooks/useAuditLogs";
export { useRole } from "./hooks/useRole";

// Components
export { CompliancePanel } from "./components/CompliancePanel";
export { ComplianceDashboard } from "./components/ComplianceDashboard";
export { ForensicMonitoring } from "./components/ForensicMonitoring";

// Utils
export { exportAuditLogsToCSV, exportAuditLogsToCSVCustom } from "./utils/export-csv";
