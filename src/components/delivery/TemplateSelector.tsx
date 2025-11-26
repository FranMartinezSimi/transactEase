"use client";

import { Label } from "@shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { FileText } from "lucide-react";

export interface TemplateItem {
  id: string;
  name: string;
  description?: string;
  expiresInHours: number;
  maxViews: number;
  maxDownloads: number;
  message?: string;
  isDefault?: boolean;
}

export function TemplateSelector({ templates, onSelect }: {
  templates: TemplateItem[];
  onSelect: (id: string) => void;
}) {
  if (!templates?.length) return null;
  return (
    <div className="space-y-2">
      <Label htmlFor="template">Load from Template</Label>
      <Select onValueChange={onSelect}>
        <SelectTrigger id="template">
          <SelectValue placeholder="Select a template (optional)" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{template.name}</span>
                {template.isDefault && (
                  <span className="text-xs text-muted-foreground">(Default)</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">Load predefined values from a template</p>
    </div>
  );
}

