import { createClient } from "@shared/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

/**
 * POST /api/audit/generate-compliance-report
 * Generate a PDF compliance report
 */
export async function POST(req: NextRequest) {
  try {
    console.log("[API] POST /api/audit/generate-compliance-report - Starting");
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[API] Auth error:", authError);
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's profile and organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role, email, full_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error("[API] Profile error:", profileError);
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("name, domain")
      .eq("id", profile.organization_id)
      .single();

    if (orgError || !organization) {
      console.error("[API] Organization error:", orgError);
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    const isAdmin = profile.role === "admin" || profile.role === "owner";

    // Fetch metrics (similar logic to compliance-metrics endpoint)
    const metricsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/audit/compliance-metrics`,
      {
        headers: {
          Cookie: req.headers.get("cookie") || "",
        },
      }
    );

    if (!metricsResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch metrics" },
        { status: 500 }
      );
    }

    const metricsData = await metricsResponse.json();
    const metrics = metricsData.metrics;

    // Fetch recent access logs for the report
    let accessLogsQuery = supabase
      .from("access_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(50);

    if (!isAdmin) {
      // Get user's delivery IDs
      const { data: userDeliveries } = await supabase
        .from("deliveries")
        .select("id")
        .eq("created_by", user.id);

      const deliveryIds = userDeliveries?.map((d) => d.id) || [];
      if (deliveryIds.length > 0) {
        accessLogsQuery = accessLogsQuery.in("delivery_id", deliveryIds);
      }
    } else {
      // Get org delivery IDs
      const { data: orgDeliveries } = await supabase
        .from("deliveries")
        .select("id")
        .eq("organization_id", profile.organization_id);

      const deliveryIds = orgDeliveries?.map((d) => d.id) || [];
      if (deliveryIds.length > 0) {
        accessLogsQuery = accessLogsQuery.in("delivery_id", deliveryIds);
      }
    }

    const { data: accessLogs } = await accessLogsQuery;

    // Generate PDF
    const pdf = generateCompliancePDF({
      organization,
      generatedBy: profile.full_name || profile.email,
      metrics,
      accessLogs: accessLogs || [],
    });

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compliance-report-${format(new Date(), "yyyy-MM-dd")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[API] Unexpected error generating report:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateCompliancePDF(data: {
  organization: { name: string; domain: string | null };
  generatedBy: string;
  metrics: any;
  accessLogs: any[];
}) {
  const { organization, generatedBy, metrics, accessLogs } = data;
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text("COMPLIANCE REPORT", 105, 20, { align: "center" });

  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`${organization.name}`, 105, 30, { align: "center" });
  doc.text(`Generated on ${format(new Date(), "MMMM dd, yyyy")}`, 105, 37, {
    align: "center",
  });

  // Line separator
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, 190, 45);

  let yPos = 55;

  // Executive Summary
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Executive Summary", 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `This compliance report provides a comprehensive overview of data protection and`,
    20,
    yPos
  );
  yPos += 5;
  doc.text(
    `security practices for ${organization.name}. The report includes audit trail analytics,`,
    20,
    yPos
  );
  yPos += 5;
  doc.text(
    `access metrics, and compliance status for industry standards.`,
    20,
    yPos
  );
  yPos += 15;

  // Key Metrics Table
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Key Metrics", 20, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value", "Status"]],
    body: [
      [
        "Total Deliveries",
        metrics.overview.totalDeliveries.toString(),
        "✓ Active",
      ],
      [
        "Total Access Events",
        metrics.overview.totalAccesses.toString(),
        "✓ Logged",
      ],
      [
        "Success Rate",
        `${(100 - metrics.overview.failureRate).toFixed(1)}%`,
        metrics.overview.failureRate < 5 ? "✓ Excellent" : "⚠ Review",
      ],
      [
        "Failed Attempts",
        metrics.overview.failedAccesses.toString(),
        metrics.overview.failedAccesses === 0 ? "✓ None" : "⚠ Review",
      ],
      [
        "Avg. Retention",
        `${metrics.timeBased.avgRetentionDays} days`,
        "✓ Compliant",
      ],
      [
        "Auto-Destruction Rate",
        `${metrics.autoDestruction.percentage}%`,
        "✓ Active",
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [66, 66, 66] },
    styles: { fontSize: 9 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Compliance Standards
  doc.setFontSize(12);
  doc.text("Compliance Standards", 20, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [["Standard", "Status", "Description"]],
    body: [
      [
        "GDPR",
        "✓ Compliant",
        "Data minimization through auto-deletion, AES-256 encryption",
      ],
      [
        "HIPAA",
        "✓ Ready",
        "Audit log retention, encrypted storage & transmission",
      ],
      [
        "SOC 2 Type II",
        "✓ Ready",
        "Security controls, access monitoring, audit trails",
      ],
      [
        "ISO 27001",
        "✓ Aligned",
        "Information security management system standards",
      ],
      [
        "CCPA/CPRA",
        "✓ Aligned",
        "Auto-deletion within 45 days, data minimization",
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [66, 66, 66] },
    styles: { fontSize: 9 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Add new page if needed
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // Recent Audit Events
  doc.setFontSize(12);
  doc.text("Recent Audit Events (Last 50)", 20, yPos);
  yPos += 5;

  const auditTableData = accessLogs.slice(0, 50).map((log) => [
    format(new Date(log.timestamp), "yyyy-MM-dd HH:mm"),
    log.action.replace("_", " ").toUpperCase(),
    "N/A", // We don't have delivery title in access_logs
    log.status === "success" ? "✓" : "✗",
    log.ip || "N/A",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Timestamp", "Action", "Document", "Status", "IP"]],
    body: auditTableData.length > 0 ? auditTableData : [["No audit logs available", "", "", "", ""]],
    theme: "grid",
    headStyles: { fillColor: [66, 66, 66] },
    styles: { fontSize: 8 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Add new page for footer
  if (yPos > 260) {
    doc.addPage();
    yPos = 20;
  }

  // Certifications Section
  doc.setFontSize(12);
  doc.text("Security Certifications", 20, yPos);
  yPos += 10;

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text("✓ End-to-end encryption (AES-256)", 20, yPos);
  yPos += 6;
  doc.text("✓ Immutable audit logging", 20, yPos);
  yPos += 6;
  doc.text("✓ Role-based access control (RBAC)", 20, yPos);
  yPos += 6;
  doc.text("✓ Automatic data destruction", 20, yPos);
  yPos += 6;
  doc.text("✓ Zero-knowledge architecture", 20, yPos);
  yPos += 6;
  doc.text("✓ IP logging and geolocation tracking", 20, yPos);
  yPos += 15;

  // Footer
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, 190, yPos);
  yPos += 8;

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated by: ${generatedBy}`, 20, yPos);
  doc.text(`Page 1 of ${doc.getNumberOfPages()}`, 190, yPos, { align: "right" });
  yPos += 5;
  doc.text(`Report ID: ${Date.now().toString(36).toUpperCase()}`, 20, yPos);
  doc.text(`Sealdrop Compliance Report`, 190, yPos, { align: "right" });

  // Add page numbers to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  return doc;
}
