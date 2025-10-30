"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export function SuccessPanel({ link, onCopy, onOpen, onReset }: {
  link: string;
  onCopy: () => void;
  onOpen: () => void;
  onReset: () => void;
}) {
  return (
    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertDescription>
        <div className="space-y-3">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">File sent successfully!</p>
          <div className="flex gap-2">
            <Button onClick={onCopy}>Copy link</Button>
            <Button variant="outline" onClick={onOpen}>Open link</Button>
            <Button variant="outline" onClick={onReset}>Send another</Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}


