"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  Clock,
  Download,
  TrendingUp,
  TrendingDown,
  MapPin,
  Activity,
  Loader2
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { toast } from "sonner";

interface ComplianceMetrics {
  overview: {
    totalDeliveries: number;
    activeDeliveries: number;
    expiredDeliveries: number;
    revokedDeliveries: number;
    totalAccesses: number;
    successfulAccesses: number;
    failedAccesses: number;
    failureRate: number;
  };
  timeBased: {
    currentMonth: number;
    lastMonth: number;
    avgRetentionDays: number;
  };
  geographic: {
    topLocations: Array<{ location: string; count: number }>;
    uniqueLocations: number;
  };
  actions: {
    distribution: Record<string, number>;
  };
  autoDestruction: {
    total: number;
    percentage: number;
  };
  trend: Array<{
    month: string;
    accesses: number;
    successful: number;
    failed: number;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function ComplianceDashboard() {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/audit/compliance-metrics");
      const data = await response.json();

      if (response.ok && data.success) {
        setMetrics(data.metrics);
      } else {
        toast.error(data.error || "Failed to load compliance metrics");
      }
    } catch (error) {
      console.error("[Compliance] Error fetching metrics:", error);
      toast.error("An error occurred while loading metrics");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPDF(true);
      const response = await fetch("/api/audit/generate-compliance-report", {
        method: "POST",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `compliance-report-${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Compliance report generated successfully");
      } else {
        toast.error("Failed to generate report");
      }
    } catch (error) {
      console.error("[Compliance] Error generating PDF:", error);
      toast.error("An error occurred while generating report");
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No compliance data available
      </div>
    );
  }

  // Prepare chart data
  const actionData = Object.entries(metrics.actions.distribution).map(([action, count]) => ({
    name: action.replace("_", " ").toUpperCase(),
    value: count,
  }));

  const statusData = [
    { name: "Active", value: metrics.overview.activeDeliveries },
    { name: "Expired", value: metrics.overview.expiredDeliveries },
    { name: "Revoked", value: metrics.overview.revokedDeliveries },
  ];

  const monthChange = metrics.timeBased.lastMonth > 0
    ? ((metrics.timeBased.currentMonth - metrics.timeBased.lastMonth) / metrics.timeBased.lastMonth) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with PDF Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Dashboard</h2>
          <p className="text-muted-foreground">Real-time compliance metrics and security status</p>
        </div>
        <Button onClick={handleGeneratePDF} disabled={generatingPDF}>
          {generatingPDF ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export PDF Report
            </>
          )}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Deliveries"
          value={metrics.overview.totalDeliveries.toString()}
          icon={<FileText className="h-4 w-4" />}
          status="good"
        />
        <MetricCard
          title="Total Accesses"
          value={metrics.overview.totalAccesses.toString()}
          icon={<Activity className="h-4 w-4" />}
          status="good"
        />
        <MetricCard
          title="Success Rate"
          value={`${(100 - metrics.overview.failureRate).toFixed(1)}%`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          status={metrics.overview.failureRate < 5 ? "good" : "warning"}
        />
        <MetricCard
          title="Avg. Retention"
          value={`${metrics.timeBased.avgRetentionDays} days`}
          icon={<Clock className="h-4 w-4" />}
          status="good"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Access Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Access Trend (Last 6 Months)</CardTitle>
            <CardDescription>
              Track successful and failed access attempts over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="successful" stroke="#00C49F" name="Successful" />
                <Line type="monotone" dataKey="failed" stroke="#FF8042" name="Failed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Delivery Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery Status Distribution</CardTitle>
            <CardDescription>
              Overview of delivery lifecycle stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Action Type Distribution</CardTitle>
            <CardDescription>
              Breakdown of user actions recorded in audit logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={actionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Top Access Locations
            </CardTitle>
            <CardDescription>
              Most common geographic access points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.geographic.topLocations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No location data available
                </p>
              ) : (
                metrics.geographic.topLocations.map((location, index) => {
                  const percentage = metrics.overview.totalAccesses > 0
                    ? (location.count / metrics.overview.totalAccesses) * 100
                    : 0;

                  return (
                    <div key={location.location} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{location.location}</span>
                        <span className="text-muted-foreground">
                          {location.count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance Status
          </CardTitle>
          <CardDescription>
            Current compliance posture and security metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Compliance Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ComplianceItem
              title="Audit Logging"
              description={`${metrics.overview.totalAccesses} events logged immutably`}
              status="compliant"
              icon={<FileText className="h-4 w-4" />}
            />
            <ComplianceItem
              title="Data Encryption"
              description="End-to-end encryption for all deliveries"
              status="compliant"
              icon={<Lock className="h-4 w-4" />}
            />
            <ComplianceItem
              title="Auto-Destruction"
              description={`${metrics.autoDestruction.percentage}% of deliveries auto-destructed`}
              status="compliant"
              icon={<Shield className="h-4 w-4" />}
            />
            <ComplianceItem
              title="Access Control"
              description={`${(100 - metrics.overview.failureRate).toFixed(1)}% authentication success rate`}
              status={metrics.overview.failureRate < 5 ? "compliant" : "warning"}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
          </div>

          {/* Compliance Standards */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">Compliance Standards</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                GDPR Ready
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                SOC 2 Type II
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                ISO 27001
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                HIPAA Compliant
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                CCPA Aligned
              </Badge>
            </div>
          </div>

          {/* Month-over-Month Comparison */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">Month-over-Month Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Current Month</p>
                <p className="text-2xl font-bold mt-1">{metrics.timeBased.currentMonth}</p>
                <p className="text-xs text-muted-foreground mt-1">accesses</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Last Month</p>
                <p className="text-2xl font-bold mt-1">{metrics.timeBased.lastMonth}</p>
                <p className="text-xs text-muted-foreground mt-1">accesses</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Change</p>
                <p className={`text-2xl font-bold mt-1 flex items-center gap-2 ${
                  monthChange >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {monthChange >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  {Math.abs(monthChange).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">vs last month</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ComplianceItemProps {
  title: string;
  description: string;
  status: "compliant" | "warning" | "non-compliant";
  icon: React.ReactNode;
}

function ComplianceItem({ title, description, status, icon }: ComplianceItemProps) {
  const getStatusColor = () => {
    switch (status) {
      case "compliant":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "non-compliant":
        return "text-red-500";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "non-compliant":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`mt-1 ${getStatusColor()}`}>{icon}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{title}</h4>
            {getStatusIcon()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  status: "good" | "warning" | "bad";
  icon: React.ReactNode;
}

function MetricCard({ title, value, status, icon }: MetricCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "good":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "bad":
        return "text-red-600";
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${getStatusColor()}`}>{value}</p>
          </div>
          <div className={`${getStatusColor()}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
