"use client";
import React, { useState } from "react";
import { AuthenticatedLayout } from "@shared/components/AuthenticatedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Textarea } from "@shared/components/ui/textarea";
import { Switch } from "@shared/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/components/ui/alert-dialog";
import { Upload, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@shared/lib/supabase/client";
import { TemplateSelector } from "@/components/delivery/TemplateSelector";
import { DeliveryUploadArea } from "@/components/delivery/DeliveryUploadArea";
import { SecurityControls } from "@/components/delivery/SecurityControls";
import { ProgressBar } from "@/components/delivery/ProgressBar";
import { SuccessPanel } from "@/components/delivery/SuccessPanel";

export default function Send() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deliveryLink, setDeliveryLink] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTempUserWarning, setShowTempUserWarning] = useState(false);

  // Fetch templates desde Supabase (cliente)
  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("delivery_templates")
        .select("id,name,description,expires_in_hours,max_views,max_downloads,message,is_default")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[delivery/page] Error fetching templates:", error);
        return [] as any[];
      }
      return (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        expiresInHours: t.expires_in_hours,
        maxViews: t.max_views,
        maxDownloads: t.max_downloads,
        message: t.message,
        isDefault: t.is_default,
      }));
    },
  });

  const [formData, setFormData] = useState({
    title: "",
    recipientEmail: "",
    message: "",
    expirationHours: "24",
    maxViews: "10",
    maxDownloads: "5",
    createTempUser: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Load template values into form
  const loadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setFormData({
      ...formData,
      message: template.message || "",
      expirationHours: template.expiresInHours.toString(),
      maxViews: template.maxViews.toString(),
      maxDownloads: template.maxDownloads.toString(),
    });

    toast.success(`Template "${template.name}" aplicado`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Calcular fecha de expiración
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(formData.expirationHours));

      // Crear FormData con todos los datos (archivo + metadata)
      const formDataUpload = new FormData();
      formDataUpload.append("files", file); // Campo "files" para FilesInterceptor
      formDataUpload.append("title", formData.title);
      formDataUpload.append("recipientEmail", formData.recipientEmail);
      formDataUpload.append("message", formData.message || "");
      formDataUpload.append("expiresAt", expiresAt.toISOString());
      formDataUpload.append("maxViews", formData.maxViews);
      formDataUpload.append("maxDownloads", formData.maxDownloads);
      formDataUpload.append("createTempUser", formData.createTempUser.toString());

      // Simular progreso (fetch no soporta onUploadProgress nativamente)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      // Un solo endpoint hace todo: crea delivery, sube a S3, envía email
      // No agregamos headers porque FormData necesita que el browser configure
      // el Content-Type automáticamente con el boundary correcto
      const response = await fetch(`/api/deliveries/upload`, {
        method: 'POST',
        body: formDataUpload,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error uploading file' }));
        throw new Error(error.message || 'Error uploading file');
      }

      const data = await response.json();
      const deliveryId = data.id;
      setUploadProgress(100);

      // Generate delivery link
      const link = `${window.location.origin}/delivery/${deliveryId}`;
      setDeliveryLink(link);

      toast.success(`Archivo enviado a ${formData.recipientEmail}`);

      // Limpiar formulario
      setFormData({
        title: "",
        recipientEmail: "",
        message: "",
        expirationHours: "24",
        maxViews: "10",
        maxDownloads: "5",
        createTempUser: false,
      });
      setFile(null);
    } catch (error: any) {
      console.error("Error sending file:", error);
      toast.error(error?.message || "Could not send the file");
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (deliveryLink) {
      navigator.clipboard.writeText(deliveryLink);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Send Documents
            </CardTitle>
            <CardDescription>
              Share files securely with access controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deliveryLink ? (
              <SuccessPanel
                link={deliveryLink}
                onCopy={copyToClipboard}
                onOpen={() => window.open(deliveryLink!, '_blank')}
                onReset={() => setDeliveryLink(null)}
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <TemplateSelector templates={templates as any} onSelect={loadTemplate} />

                <DeliveryUploadArea
                  file={file}
                  isDragging={isDragging}
                  isUploading={isUploading}
                  onFileChange={handleFileChange}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onRemove={removeFile}
                  formatFileSize={formatFileSize}
                />

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g: Lease Agreement"
                    required
                    disabled={isUploading}
                  />
                </div>

                {/* Recipient Email */}
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">Recipient's email *</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, recipientEmail: e.target.value })
                    }
                    placeholder="recipient@example.com"
                    required
                    disabled={isUploading}
                  />
                </div>

                {/* Create Temporary User */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border-2 border-orange-200">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="createTempUser" className="text-base font-medium cursor-pointer">
                        External recipient (temporary user)
                      </Label>
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enable this if the recipient is not part of your organization. A temporary account will be created automatically.
                    </p>
                  </div>
                  <Switch
                    id="createTempUser"
                    checked={formData.createTempUser}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        // Show warning modal before enabling
                        setShowTempUserWarning(true);
                      } else {
                        // Allow disabling without warning
                        setFormData({ ...formData, createTempUser: false });
                      }
                    }}
                    disabled={isUploading}
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">Message (optional)</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Add a message for the recipient..."
                    rows={4}
                    disabled={isUploading}
                  />
                </div>

                <SecurityControls
                  expirationHours={formData.expirationHours}
                  maxViews={formData.maxViews}
                  maxDownloads={formData.maxDownloads}
                  disabled={isUploading}
                  onChange={(p) => setFormData({ ...formData, ...p })}
                />

                {/* Progress Bar */}
                {isUploading && <ProgressBar progress={uploadProgress} />}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isUploading || !file}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Send File
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Temporary User Warning Modal */}
        <AlertDialog open={showTempUserWarning} onOpenChange={setShowTempUserWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                External User Warning
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 pt-2">
                <p className="font-medium text-foreground">
                  You are about to create a temporary user account for an external recipient.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-foreground">Please be aware:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>This recipient is <strong>not part of your organization</strong></li>
                    <li>A temporary account will be created with <strong>limited access</strong></li>
                    <li>All activity will be <strong>logged and monitored</strong> for compliance</li>
                    <li>The account will <strong>expire</strong> when the delivery expires</li>
                    <li>External access carries <strong>additional security risks</strong></li>
                  </ul>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-3">
                  <p className="text-sm text-orange-900">
                    <strong>Recommendation:</strong> Only enable this for trusted external recipients.
                    For internal communications, use organizational email addresses.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setFormData({ ...formData, createTempUser: false })}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setFormData({ ...formData, createTempUser: true });
                  setShowTempUserWarning(false);
                  toast.info("Temporary user mode enabled. The recipient will receive temporary access.");
                }}
                className="bg-orange-600 hover:bg-orange-700"
              >
                I Understand, Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthenticatedLayout>
  );
}
