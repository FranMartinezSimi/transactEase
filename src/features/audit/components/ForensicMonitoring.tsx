"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Badge } from "@shared/components/ui/badge";
import { Eye, AlertTriangle, Activity, TrendingUp, MapPin, Globe } from "lucide-react";

export function ForensicMonitoring() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Forensic Monitoring & Security Intelligence
          </CardTitle>
          <CardDescription>
            Real-time security monitoring and threat detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Alerts */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Recent Security Events</h3>
            <div className="space-y-3">
              <SecurityAlert
                type="info"
                title="Normal Activity Detected"
                description="All access patterns within normal parameters"
                timestamp="2 minutes ago"
              />
              <SecurityAlert
                type="warning"
                title="Multiple Failed Attempts"
                description="3 failed access attempts from IP 203.0.113.42"
                timestamp="1 hour ago"
              />
            </div>
          </div>

          {/* Geographic Distribution */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Geographic Access Distribution
            </h3>
            <div className="space-y-2">
              <LocationBar country="United States" percentage={45} count={12} />
              <LocationBar country="United Kingdom" percentage={25} count={7} />
              <LocationBar country="Germany" percentage={20} count={5} />
              <LocationBar country="Others" percentage={10} count={3} />
            </div>
          </div>

          {/* Access Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PatternCard
              icon={<Activity className="h-5 w-5" />}
              title="Peak Access Time"
              value="2:00 PM - 4:00 PM"
              trend="normal"
            />
            <PatternCard
              icon={<Globe className="h-5 w-5" />}
              title="Unique IPs"
              value="24"
              trend="up"
            />
            <PatternCard
              icon={<TrendingUp className="h-5 w-5" />}
              title="Access Rate"
              value="1.2/hour"
              trend="normal"
            />
          </div>

          {/* Threat Intelligence */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Threat Intelligence</h3>
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  No Active Threats
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                No suspicious activity or known threat actors detected in the last 30 days.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SecurityAlertProps {
  type: "info" | "warning" | "critical";
  title: string;
  description: string;
  timestamp: string;
}

function SecurityAlert({ type, title, description, timestamp }: SecurityAlertProps) {
  const getAlertColor = () => {
    switch (type) {
      case "info":
        return "border-blue-200 bg-blue-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "critical":
        return "border-red-200 bg-red-50";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "info":
        return <Activity className="h-4 w-4 text-blue-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${getAlertColor()}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{title}</h4>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface LocationBarProps {
  country: string;
  percentage: number;
  count: number;
}

function LocationBar({ country, percentage, count }: LocationBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium">{country}</span>
        <span className="text-muted-foreground">{count} accesses</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface PatternCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: "up" | "down" | "normal";
}

function PatternCard({ icon, title, value, trend }: PatternCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      case "normal":
        return "text-muted-foreground";
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{title}</span>
      </div>
      <p className={`text-xl font-bold ${getTrendColor()}`}>{value}</p>
    </div>
  );
}
