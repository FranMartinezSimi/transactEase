"use client";
import React, { useState } from "react";
import { AuthenticatedLayout } from "@shared/components/AuthenticatedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Textarea } from "@shared/components/ui/textarea";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

  const [formData, setFormData] = useState({
    title: "",
    recipientEmail: "",
    message: "",
    expirationHours: "24",
    maxViews: "10",
    maxDownloads: "5",
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
      // ALWAYS create temp user for recipients (they're always external clients)
      formDataUpload.append("createTempUser", "true");

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
                  onChange={(p: { expirationHours?: string; maxViews?: string; maxDownloads?: string }) => setFormData({ ...formData, ...p })}
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
      </div>
    </AuthenticatedLayout>
  );
}
