"use client";

import { Label } from "@shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { Input } from "@shared/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@shared/components/ui/tooltip";
import { Clock, Download, Eye, Info, Shield } from "lucide-react";

interface SecurityControlsProps {
  expirationHours: string;
  maxViews: string;
  maxDownloads: string;
  disabled: boolean;
  onChange: (p: { expirationHours?: string; maxViews?: string; maxDownloads?: string }) => void;
}

export function SecurityControls({
  expirationHours,
  maxViews,
  maxDownloads,
  disabled,
  onChange,
}: SecurityControlsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold">Security Controls</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TooltipProvider>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="expirationHours">Expiration</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>The document will self-destruct after this time</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={expirationHours}
              onValueChange={(value) => onChange({ expirationHours: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="72">3 days</SelectItem>
                <SelectItem value="168">7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="maxViews">Max. views</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximum number of times the document can be viewed</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="maxViews"
              type="number"
              min="1"
              max="1000"
              value={maxViews}
              disabled={disabled}
              onChange={(e) => onChange({ maxViews: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="maxDownloads">Max. downloads</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximum number of allowed downloads</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="maxDownloads"
              type="number"
              min="1"
              max="1000"
              value={maxDownloads}
              disabled={disabled}
              onChange={(e) => onChange({ maxDownloads: e.target.value })}
            />
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}

