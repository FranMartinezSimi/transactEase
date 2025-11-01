"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Send, Ban, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  revokeDelivery,
  deleteDelivery,
  resendDeliveryNotification,
  getDeliveryLink,
} from "@/app/actions/delivery-actions";

interface DeliveryActionsProps {
  deliveryId: string;
  deliveryTitle: string;
  status: "active" | "expired" | "revoked";
  isAdmin?: boolean;
  onActionComplete?: () => void;
}

export function DeliveryActions({
  deliveryId,
  deliveryTitle,
  status,
  isAdmin = false,
  onActionComplete,
}: DeliveryActionsProps) {
  const router = useRouter();
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Copy delivery link to clipboard
  async function handleCopyLink() {
    const link = await getDeliveryLink(deliveryId);
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  }

  // Revoke delivery
  async function handleRevoke() {
    setIsRevoking(true);
    const result = await revokeDelivery(deliveryId);
    setIsRevoking(false);
    setShowRevokeDialog(false);

    if (result.success) {
      toast.success("Delivery revoked successfully");
      onActionComplete?.(); // Refresh deliveries list
    } else {
      toast.error(result.error || "Failed to revoke delivery");
    }
  }

  // Delete delivery
  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteDelivery(deliveryId);
    setIsDeleting(false);
    setShowDeleteDialog(false);

    if (result.success) {
      toast.success("Delivery deleted successfully");
      onActionComplete?.(); // Refresh deliveries list
    } else {
      toast.error(result.error || "Failed to delete delivery");
    }
  }

  // Resend notification
  async function handleResend() {
    setIsResending(true);
    const result = await resendDeliveryNotification(deliveryId);
    setIsResending(false);

    if (result.success) {
      toast.success("Notification email sent!");
    } else {
      toast.error(result.error || "Failed to send notification");
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Copy Link - Always available */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="flex items-center gap-1.5"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy Link
        </Button>

        {/* Resend - Only for active deliveries */}
        {status === "active" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={isResending}
            className="flex items-center gap-1.5"
          >
            {isResending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Resend
          </Button>
        )}

        {/* Revoke - Only for active deliveries */}
        {status === "active" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRevokeDialog(true)}
            className="flex items-center gap-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <Ban className="h-3.5 w-3.5" />
            Revoke
          </Button>
        )}

        {/* Delete - Available for all, but admins can delete any */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Delivery</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke "{deliveryTitle}"? The recipient
              will no longer be able to access this delivery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isRevoking}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isRevoking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delivery</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deliveryTitle}"? This action
              cannot be undone. All files and access logs will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
