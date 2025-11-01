"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, AlertTriangle, FileText, Lock, Clock } from "lucide-react";

export function CompliancePanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance & Security Status
          </CardTitle>
          <CardDescription>
            Overview of security compliance and data protection status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Compliance Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ComplianceItem
              title="Audit Logging"
              description="All access events are logged immutably"
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
              title="Access Controls"
              description="Role-based access control (RBAC) enabled"
              status="compliant"
              icon={<Shield className="h-4 w-4" />}
            />
            <ComplianceItem
              title="Retention Policy"
              description="30-day log retention configured"
              status="warning"
              icon={<Clock className="h-4 w-4" />}
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
            </div>
          </div>

          {/* Security Metrics */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Failed Access Attempts" value="0" status="good" />
            <MetricCard title="Avg. Response Time" value="<2s" status="good" />
            <MetricCard title="Uptime" value="99.9%" status="good" />
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
}

function MetricCard({ title, value, status }: MetricCardProps) {
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
    <div className="border rounded-lg p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${getStatusColor()}`}>{value}</p>
    </div>
  );
}
