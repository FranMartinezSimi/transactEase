"use client";

import { useState } from "react";
import { AuthenticatedLayout } from "@shared/components/AuthenticatedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Badge } from "@shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";
import { Calendar } from "@shared/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { useRole, useAuditLogs, exportAuditLogsToCSV, CompliancePanel, ForensicMonitoring } from "@features/audit";
import { toast } from "sonner";
import {
  Shield,
  Download,
  Calendar as CalendarIcon,
  Search,
  Filter,
  X,
  Eye,
  FileDown,
  AlertTriangle,
  Clock,
  User,
  Mail,
  MapPin,
  List,
  BarChart3,
} from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@shared/utils/utils";

type ActionType = "view" | "download" | "access_attempt" | "expired" | "security_alert" | "all";

export default function Audit() {
  const { isAdmin, permissions, loading: roleLoading } = useRole();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [searchEmail, setSearchEmail] = useState("");
  const [searchDomain, setSearchDomain] = useState("all-domains");
  const [actionFilter, setActionFilter] = useState<ActionType>("all");
  const [senderFilter, setSenderFilter] = useState("all");

  // Fetch real audit logs
  const { logs: auditLogs, loading: logsLoading } = useAuditLogs({
    dateFrom,
    dateTo,
    searchEmail,
    actionFilter: actionFilter === "all" ? undefined : actionFilter,
    senderFilter: senderFilter === "all" ? undefined : senderFilter,
    isAdmin,
  });

  // Use real logs instead of mock data
  const mockAuditLogs = auditLogs;

  // Extract unique domains from logs
  const uniqueDomains = Array.from(
    new Set(
      mockAuditLogs
        .map((log) => log.recipientEmail.split("@")[1])
        .filter(Boolean)
    )
  );

  // Extract unique senders (admin only)
  const uniqueSenders = Array.from(
    new Set(mockAuditLogs.map((log) => log.senderEmail))
  );

  // Filter logs
  const filteredLogs = mockAuditLogs.filter((log) => {
    if (dateFrom && log.timestamp < dateFrom) return false;
    if (dateTo && log.timestamp > dateTo) return false;
    if (searchEmail && !log.recipientEmail.toLowerCase().includes(searchEmail.toLowerCase()))
      return false;
    if (searchDomain && searchDomain !== "all-domains" && !log.recipientEmail.endsWith(`@${searchDomain}`)) return false;
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (senderFilter !== "all" && log.senderEmail !== senderFilter) return false;
    return true;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "view":
        return <Eye className="h-4 w-4" />;
      case "download":
        return <FileDown className="h-4 w-4" />;
      case "access_attempt":
        return <AlertTriangle className="h-4 w-4" />;
      case "expired":
        return <Clock className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string, status: string) => {
    if (status === "failed") return "destructive";
    switch (action) {
      case "view":
        return "default";
      case "download":
        return "secondary";
      case "expired":
        return "outline";
      case "access_attempt":
        return "destructive";
      default:
        return "default";
    }
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchEmail("");
    setSearchDomain("all-domains");
    setActionFilter("all");
    setSenderFilter("all");
  };

  const hasActiveFilters =
    dateFrom || dateTo || searchEmail || (searchDomain && searchDomain !== "all-domains") || actionFilter !== "all" || senderFilter !== "all";

  const handleExportCSV = () => {
    try {
      if (filteredLogs.length === 0) {
        toast.error("No logs to export");
        return;
      }

      exportAuditLogsToCSV(filteredLogs);
      toast.success(`Exported ${filteredLogs.length} logs to CSV`);
    } catch (error) {
      console.error("[Audit] Export error:", error);
      toast.error("Failed to export logs");
    }
  };

  // Get logs for selected date in calendar view
  const logsForSelectedDate = mockAuditLogs.filter((log) =>
    isSameDay(log.timestamp, selectedDate)
  );

  // Calculate activity heatmap for calendar
  const getActivityForDate = (date: Date) => {
    const count = mockAuditLogs.filter((log) => isSameDay(log.timestamp, date)).length;
    if (count === 0) return "none";
    if (count <= 2) return "low";
    if (count <= 5) return "medium";
    return "high";
  };

  // Get current month days for calendar view
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <Tabs defaultValue="logs" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Audit Logs
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Compliance & Security
              </TabsTrigger>
              <TabsTrigger value="forensic" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Forensic Monitoring
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Audit Log
                      {!isAdmin && <Badge variant="outline">Personal View</Badge>}
                      {isAdmin && <Badge variant="default">Full View</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {isAdmin
                        ? "Complete history of accesses and security events in your organization"
                        : "History of your deliveries and accesses"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v as "list" | "calendar")}>
                      <TabsList>
                        <TabsTrigger value="list" className="flex items-center gap-1">
                          <List className="h-4 w-4" />
                          List
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          Calendar
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      disabled={filteredLogs.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                    </Label>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Clear filters
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date From */}
                    <div className="space-y-2">
                      <Label>Date from</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dateFrom && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFrom ? format(dateFrom, "PPP", { locale: es }) : "Select"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateFrom}
                            onSelect={setDateFrom}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Date To */}
                    <div className="space-y-2">
                      <Label>Date to</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dateTo && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateTo ? format(dateTo, "PPP", { locale: es }) : "Select"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateTo}
                            onSelect={setDateTo}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Email Search */}
                    <div className="space-y-2">
                      <Label>Search by email</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="cliente@empresa.com"
                          value={searchEmail}
                          onChange={(e) => setSearchEmail(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {/* Domain Filter (Admin only) */}
                    {isAdmin && (
                      <div className="space-y-2">
                        <Label>Filter by domain</Label>
                        <Select value={searchDomain} onValueChange={setSearchDomain}>
                          <SelectTrigger>
                            <SelectValue placeholder="All domains" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-domains">All domains</SelectItem>
                            {uniqueDomains.map((domain) => (
                              <SelectItem key={domain} value={domain}>
                                @{domain}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Action Filter */}
                    <div className="space-y-2">
                      <Label>Action type</Label>
                      <Select
                        value={actionFilter}
                        onValueChange={(value) => setActionFilter(value as ActionType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All actions</SelectItem>
                          <SelectItem value="view">Views</SelectItem>
                          <SelectItem value="download">Downloads</SelectItem>
                          <SelectItem value="access_attempt">Access attempts</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="security_alert">Security alerts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sender Filter (Admin only) */}
                    {isAdmin && (
                      <div className="space-y-2">
                        <Label>Filter by sender</Label>
                        <Select value={senderFilter} onValueChange={setSenderFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All users" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All users</SelectItem>
                            {uniqueSenders.map((sender) => (
                              <SelectItem key={sender} value={sender}>
                                {sender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Active filters summary */}
                  {hasActiveFilters && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Showing {filteredLogs.length} of {mockAuditLogs.length} records</span>
                    </div>
                  )}
                </div>

                {/* Calendar View */}
                {viewMode === "calendar" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        {format(selectedDate, "MMMM yyyy", { locale: es })}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                        >
                          ←
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDate(new Date())}
                        >
                          Hoy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                        >
                          →
                        </Button>
                      </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {/* Weekday headers */}
                      {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                          {day}
                        </div>
                      ))}

                      {/* Calendar days */}
                      {calendarDays.map((day) => {
                        const activity = getActivityForDate(day);
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                        const logsCount = mockAuditLogs.filter((log) => isSameDay(log.timestamp, day)).length;

                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              "relative p-2 text-sm rounded-lg border transition-all hover:border-primary",
                              !isCurrentMonth && "text-muted-foreground opacity-40",
                              isSelected && "border-primary bg-primary/10 font-bold",
                              activity === "none" && "bg-muted/20",
                              activity === "low" && "bg-primary/10",
                              activity === "medium" && "bg-primary/30",
                              activity === "high" && "bg-primary/50"
                            )}
                          >
                            <div className="flex flex-col items-center">
                              <span>{format(day, "d")}</span>
                              {logsCount > 0 && (
                                <span className="text-xs mt-1 px-1.5 py-0.5 rounded-full bg-background/80">
                                  {logsCount}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Activity Legend */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Actividad:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-muted/20 border"></div>
                        <span>Ninguna</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-primary/10 border"></div>
                        <span>Baja (1-2)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-primary/30 border"></div>
                        <span>Media (3-5)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-primary/50 border"></div>
                        <span>Alta (6+)</span>
                      </div>
                    </div>

                    {/* Logs for selected date */}
                    <div className="mt-6">
                      <h4 className="text-md font-semibold mb-4">
                        Eventos del {format(selectedDate, "dd 'de' MMMM", { locale: es })}
                        <Badge variant="outline" className="ml-2">
                          {logsForSelectedDate.length} evento(s)
                        </Badge>
                      </h4>

                      {logsForSelectedDate.length === 0 ? (
                        <div className="border rounded-lg p-8 text-center text-muted-foreground">
                          No hay eventos registrados en esta fecha
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {logsForSelectedDate.map((log) => (
                            <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="mt-1">
                                    {getActionIcon(log.action)}
                                  </div>
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant={getActionColor(log.action, log.status)}>
                                        {log.action === "view" && "Vista"}
                                        {log.action === "download" && "Descarga"}
                                        {log.action === "access_attempt" && "Intento"}
                                        {log.action === "expired" && "Expirado"}
                                      </Badge>
                                      <span className="font-medium">{log.deliveryTitle}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {log.recipientEmail}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {log.location}
                                      </span>
                                      <span className="font-mono text-xs">{log.ip}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{log.details}</p>
                                  </div>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {format(log.timestamp, "HH:mm:ss")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audit Logs Table */}
                {viewMode === "list" && (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Viewer</TableHead>
                          <TableHead>Document</TableHead>
                          <TableHead>Recipient</TableHead>
                          {isAdmin && <TableHead>Sender</TableHead>}
                          <TableHead>Location</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-12">
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Search className="h-8 w-8" />
                                <p>No records found with the applied filters</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-mono text-sm">
                                <div className="flex flex-col">
                                  <span>{format(log.timestamp, "dd/MM/yyyy", { locale: es })}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(log.timestamp, "HH:mm:ss", { locale: es })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={getActionColor(log.action, log.status)}
                                  className="flex items-center gap-1 w-fit"
                                >
                                  {getActionIcon(log.action)}
                                  {log.action === "view" && "View"}
                                  {log.action === "download" && "Download"}
                                  {log.action === "access_attempt" && "Attempt"}
                                  {log.action === "expired" && "Expired"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={log.metadata?.viewer_type === "recipient" ? "default" : "secondary"}
                                  className="w-fit"
                                >
                                  <User className="h-3 w-3 mr-1" />
                                  {log.metadata?.viewer_type === "recipient" ? "Recipient" :
                                   log.metadata?.viewer_type === "sender" ? "Sender" : "Unknown"}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium max-w-[200px] truncate">
                                {log.deliveryTitle}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">{log.recipientName}</span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {log.recipientEmail}
                                  </span>
                                </div>
                              </TableCell>
                              {isAdmin && (
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-sm">{log.senderName}</span>
                                    <span className="text-xs text-muted-foreground">{log.senderEmail}</span>
                                  </div>
                                </TableCell>
                              )}
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-xs font-mono">{log.ip}</span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {log.location}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {log.details}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <CompliancePanel />
          </TabsContent>

          <TabsContent value="forensic" className="space-y-6">
            <ForensicMonitoring />
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}

