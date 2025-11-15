import { format } from "date-fns";
import type { AuditLog } from "../hooks/useAuditLogs";

/**
 * Export audit logs to CSV format
 */
export function exportAuditLogsToCSV(logs: AuditLog[], filename?: string) {
  if (logs.length === 0) {
    throw new Error("No logs to export");
  }

  // Define CSV headers
  const headers = [
    "Timestamp",
    "Date",
    "Time",
    "Action",
    "Status",
    "Viewer Type",
    "Document Title",
    "Delivery ID",
    "Recipient Email",
    "Recipient Name",
    "Sender Email",
    "Sender Name",
    "IP Address",
    "Location",
    "User Agent",
    "Details",
  ];

  // Convert logs to CSV rows
  const rows = logs.map((log) => {
    const viewerType = log.metadata?.viewer_type || "";
    const viewerTypeLabel = viewerType === "recipient" ? "Recipient" : viewerType === "sender" ? "Sender" : "Unknown";

    return [
      log.timestamp.toISOString(), // Full ISO timestamp
      format(log.timestamp, "yyyy-MM-dd"), // Date only
      format(log.timestamp, "HH:mm:ss"), // Time only
      log.action,
      log.status,
      viewerTypeLabel,
      escapeCSV(log.deliveryTitle),
      log.deliveryId,
      log.recipientEmail,
      log.recipientName || "",
      log.senderEmail,
      log.senderName || "",
      log.ip,
      escapeCSV(log.location),
      escapeCSV(log.userAgent || ""),
      escapeCSV(log.details),
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Create filename with timestamp
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
  const finalFilename = filename || `audit_logs_${timestamp}.csv`;

  // Download CSV file
  downloadCSV(csvContent, finalFilename);
}

/**
 * Escape special characters in CSV fields
 */
function escapeCSV(field: string): string {
  if (!field) return "";

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }

  return field;
}

/**
 * Trigger browser download of CSV content
 */
function downloadCSV(content: string, filename: string) {
  // Create a Blob with UTF-8 BOM for Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });

  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export logs with custom column selection
 */
export function exportAuditLogsToCSVCustom(
  logs: AuditLog[],
  columns: {
    timestamp?: boolean;
    action?: boolean;
    status?: boolean;
    deliveryTitle?: boolean;
    deliveryId?: boolean;
    recipientEmail?: boolean;
    recipientName?: boolean;
    senderEmail?: boolean;
    senderName?: boolean;
    ip?: boolean;
    location?: boolean;
    userAgent?: boolean;
    details?: boolean;
  },
  filename?: string
) {
  if (logs.length === 0) {
    throw new Error("No logs to export");
  }

  // Build headers based on selected columns
  const headers: string[] = [];
  const columnKeys: (keyof typeof columns)[] = [];

  if (columns.timestamp !== false) {
    headers.push("Timestamp", "Date", "Time");
    columnKeys.push("timestamp");
  }
  if (columns.action !== false) {
    headers.push("Action");
    columnKeys.push("action");
  }
  if (columns.status !== false) {
    headers.push("Status");
    columnKeys.push("status");
  }
  if (columns.deliveryTitle !== false) {
    headers.push("Document Title");
    columnKeys.push("deliveryTitle");
  }
  if (columns.deliveryId !== false) {
    headers.push("Delivery ID");
    columnKeys.push("deliveryId");
  }
  if (columns.recipientEmail !== false) {
    headers.push("Recipient Email");
    columnKeys.push("recipientEmail");
  }
  if (columns.recipientName !== false) {
    headers.push("Recipient Name");
    columnKeys.push("recipientName");
  }
  if (columns.senderEmail !== false) {
    headers.push("Sender Email");
    columnKeys.push("senderEmail");
  }
  if (columns.senderName !== false) {
    headers.push("Sender Name");
    columnKeys.push("senderName");
  }
  if (columns.ip !== false) {
    headers.push("IP Address");
    columnKeys.push("ip");
  }
  if (columns.location !== false) {
    headers.push("Location");
    columnKeys.push("location");
  }
  if (columns.userAgent !== false) {
    headers.push("User Agent");
    columnKeys.push("userAgent");
  }
  if (columns.details !== false) {
    headers.push("Details");
    columnKeys.push("details");
  }

  // Convert logs to CSV rows with selected columns
  const rows = logs.map((log) => {
    const row: string[] = [];

    columnKeys.forEach((key) => {
      if (key === "timestamp") {
        row.push(
          log.timestamp.toISOString(),
          format(log.timestamp, "yyyy-MM-dd"),
          format(log.timestamp, "HH:mm:ss")
        );
      } else {
        const value = log[key];
        row.push(escapeCSV(String(value || "")));
      }
    });

    return row;
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Create filename with timestamp
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
  const finalFilename = filename || `audit_logs_${timestamp}.csv`;

  // Download CSV file
  downloadCSV(csvContent, finalFilename);
}
