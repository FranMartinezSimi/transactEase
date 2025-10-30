"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X } from "lucide-react";

export function DeliveryUploadArea({
  file,
  isDragging,
  isUploading,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
  formatFileSize,
}: {
  file: File | null;
  isDragging: boolean;
  isUploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemove: () => void;
  formatFileSize: (bytes: number) => string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="file">File *</Label>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
        }`}
      >
        <input id="file" type="file" onChange={onFileChange} className="hidden" disabled={isUploading} />
        {file ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={isUploading}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <label htmlFor="file" className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
              Click here to change file
            </label>
          </div>
        ) : (
          <label htmlFor="file" className="cursor-pointer block">
            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-base font-medium text-foreground mb-1">Drag and drop your file here</p>
            <p className="text-sm text-muted-foreground mb-2">or click to select</p>
            <p className="text-xs text-muted-foreground">Maximum 100MB • All formats supported</p>
          </label>
        )}
      </div>
    </div>
  );
}


