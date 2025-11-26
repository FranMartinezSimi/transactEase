"use client";

import { useEffect, useState } from "react";
import { MapPin, AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

interface LocationPermissionProps {
  onPermissionGranted: (location: GeolocationPosition) => void;
  onPermissionDenied: () => void;
}

export function LocationPermission({
  onPermissionGranted,
  onPermissionDenied,
}: LocationPermissionProps) {
  const [status, setStatus] = useState<"checking" | "requesting" | "denied" | "granted">("checking");
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser");
      setStatus("denied");
      setShowDialog(true);
      return;
    }

    // Check if permission was already granted
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });

        if (result.state === "granted") {
          requestLocation();
        } else if (result.state === "denied") {
          setStatus("denied");
          setShowDialog(true);
        } else {
          // Prompt state
          setStatus("requesting");
          setShowDialog(true);
        }

        // Listen for permission changes
        result.addEventListener("change", () => {
          if (result.state === "granted") {
            requestLocation();
          } else if (result.state === "denied") {
            setStatus("denied");
            setShowDialog(true);
          }
        });
      } catch (error) {
        // Fallback if permissions API is not available
        setStatus("requesting");
        setShowDialog(true);
      }
    } else {
      // Fallback if permissions API is not available
      setStatus("requesting");
      setShowDialog(true);
    }
  };

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus("granted");
        setShowDialog(false);
        onPermissionGranted(position);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setStatus("denied");
        setShowDialog(true);
        onPermissionDenied();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleRequestPermission = () => {
    setStatus("checking");
    requestLocation();
  };

  const handleDeny = () => {
    setStatus("denied");
    onPermissionDenied();
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {status === "denied" ? (
              <>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Location Permission Required
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5 text-blue-500" />
                Allow Location Access
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            {status === "denied" ? (
              <>
                <p className="font-medium text-foreground">
                  Location access is required to use this application.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-foreground">Why we need this:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Compliance and audit trail requirements</li>
                    <li>Security monitoring and fraud prevention</li>
                    <li>Legal documentation of document access</li>
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3">
                  <p className="text-sm text-red-900">
                    <strong>Access Denied:</strong> You cannot proceed without granting location permissions.
                    Please enable location access in your browser settings and refresh the page.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="font-medium text-foreground">
                  This application requires access to your location for security and compliance purposes.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-foreground">Your location will be used to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Create immutable audit logs for all document access</li>
                    <li>Comply with legal and regulatory requirements</li>
                    <li>Detect and prevent unauthorized access</li>
                    <li>Verify the geographic origin of transactions</li>
                  </ul>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
                  <p className="text-sm text-blue-900">
                    <strong>Privacy:</strong> Your location data is encrypted and only used for
                    security auditing. It is never shared with third parties.
                  </p>
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {status === "denied" ? (
            <div className="flex flex-col w-full gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
              <Button
                variant="outline"
                onClick={handleDeny}
                className="w-full"
              >
                Exit Application
              </Button>
            </div>
          ) : (
            <div className="flex flex-col w-full gap-2">
              <Button
                onClick={handleRequestPermission}
                disabled={status === "checking"}
                className="w-full"
              >
                {status === "checking" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Requesting Permission...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Allow Location Access
                  </>
                )}
              </Button>
            </div>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
