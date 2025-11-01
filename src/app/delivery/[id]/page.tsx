"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@shared/components/ui/alert";
import {
  Shield,
  CheckCircle,
  XCircle,
  FileText,
  Copy,
  Download,
  Eye,
  Clock,
  Loader2,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Logo from "../../../../public/Sealdrop.svg";

interface DeliveryFile {
  id: string;
  filename: string;
  original_name: string;
  hash?: string;
  size: number;
  mime_type: string;
  storage_path: string;
}

interface Delivery {
  id: string;
  title: string;
  message?: string;
  recipient_email: string;
  expires_at: string;
  status: "active" | "expired" | "revoked";
  current_views: number;
  max_views: number;
  current_downloads: number;
  max_downloads: number;
  files: DeliveryFile[];
}

export default function DeliveryViewPage({ params }: { params: Promise<{ id: string }> }) {
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Email verification state
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Access code verification state
  const [showAccessCodeInput, setShowAccessCodeInput] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [accessCodeLoading, setAccessCodeLoading] = useState(false);
  const [accessCodeSent, setAccessCodeSent] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);

  useEffect(() => {
    const initParams = async () => {
      const resolved = await params;
      setDeliveryId(resolved.id);
    };
    initParams();
  }, [params]);

  useEffect(() => {
    if (!deliveryId) return;

    const fetchDelivery = async () => {
      try {
        const url = new URL(window.location.href);
        const token = url.searchParams.get("token") ?? undefined;
        const emailParam = url.searchParams.get("email") ?? undefined;

        const queryParams = new URLSearchParams();
        if (token) queryParams.set("token", token);
        if (emailParam) queryParams.set("email", emailParam);

        const res = await fetch(`/api/deliveries/${deliveryId}?${queryParams.toString()}`);

        if (!res.ok) {
          if (res.status === 401) {
            // Need email verification
            setLoading(false);
            return;
          } else if (res.status === 403) {
            toast.error("Access denied or delivery expired");
          } else if (res.status === 404) {
            toast.error("Delivery not found");
          } else {
            toast.error("Error loading delivery");
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setDelivery(data);

        // If we got the data, we're verified
        if (emailParam) {
          setEmail(emailParam);
          setIsVerified(true);
        }
      } catch (error) {
        console.error("Error fetching delivery:", error);
        toast.error("Error loading delivery");
      } finally {
        setLoading(false);
      }
    };

    fetchDelivery();
  }, [deliveryId]);

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !deliveryId) return;

    setVerificationLoading(true);

    try {
      const res = await fetch(`/api/deliveries/${deliveryId}?email=${encodeURIComponent(email)}`);

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Email does not match recipient");
        } else if (res.status === 403) {
          toast.error("Delivery expired or access limit reached");
        } else {
          toast.error("Verification failed");
        }
        return;
      }

      const data = await res.json();
      setDelivery(data);
      setIsVerified(true);

      // Show access code input
      setShowAccessCodeInput(true);

      // Update URL with email param
      const url = new URL(window.location.href);
      url.searchParams.set("email", email);
      window.history.replaceState({}, "", url.toString());

      // Automatically request access code
      toast.success("Email verified! Sending access code...");
      await requestAccessCode();

    } catch (error) {
      console.error("Error verifying email:", error);
      toast.error("Verification error");
    } finally {
      setVerificationLoading(false);
    }
  };

  const requestAccessCode = async () => {
    if (!deliveryId || !email) return;

    setAccessCodeLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/request-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || "Failed to send access code");
        return;
      }

      setAccessCodeSent(true);
      toast.success("Access code sent to your email!");
    } catch (error) {
      console.error("Error requesting access code:", error);
      toast.error("Failed to send access code");
    } finally {
      setAccessCodeLoading(false);
    }
  };

  const verifyAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryId || !accessCode || !email) return;

    setAccessCodeLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/verify-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Invalid access code");
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        return;
      }

      // Access granted
      setShowAccessCodeInput(false);
      toast.success("Access granted! You can now download files.");
    } catch (error) {
      console.error("Error verifying access code:", error);
      toast.error("Verification failed");
    } finally {
      setAccessCodeLoading(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("Hash copied to clipboard");
  };

  const verifyFileIntegrity = async (file: DeliveryFile) => {
    if (!file.hash) {
      toast.error("No hash available for this file");
      return;
    }

    setVerifying(file.id);
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = file.mime_type;
      input.onchange = async (e: any) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) {
          setVerifying(null);
          return;
        }

        const arrayBuffer = await selectedFile.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Calculate SHA-256 hash
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        if (file.hash && hashHex.toLowerCase() === file.hash.toLowerCase()) {
          toast.success("✓ File integrity verified! Hash matches.");
        } else {
          toast.error("✗ Hash mismatch! File may have been altered.");
        }
        setVerifying(null);
      };
      input.click();
    } catch (error) {
      console.error("Error verifying file:", error);
      toast.error("Error verifying file");
      setVerifying(null);
    }
  };

  const downloadFile = async (file: DeliveryFile) => {
    if (!delivery || !deliveryId) return;

    // Check download limits
    if (delivery.current_downloads >= delivery.max_downloads) {
      toast.error("Download limit reached for this delivery");
      return;
    }

    setDownloading(file.id);

    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/download/${file.id}?email=${encodeURIComponent(email)}`);

      if (!res.ok) {
        if (res.status === 403) {
          toast.error("Download limit reached");
        } else {
          toast.error("Download failed");
        }
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Update download count
      setDelivery({
        ...delivery,
        current_downloads: delivery.current_downloads + 1
      });

      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Download error");
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading delivery...</p>
        </div>
      </div>
    );
  }

  // Email verification form
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Image src={Logo} alt="Sealdrop Logo" className="h-16 w-16" />
            </div>
            <div>
              <CardTitle className="flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                Verify Your Email
              </CardTitle>
              <CardDescription className="mt-2">
                Enter your email address to access this secure delivery
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={verificationLoading}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  This must match the recipient email address
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={verificationLoading || !email}
              >
                {verificationLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Verify & Access
                  </>
                )}
              </Button>
            </form>

            <Alert className="mt-6 bg-blue-50 dark:bg-blue-900/20">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-xs">
                Your access is logged for security and audit purposes
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access code verification form
  if (showAccessCodeInput) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Image src={Logo} alt="Sealdrop Logo" className="h-16 w-16" />
            </div>
            <div>
              <CardTitle className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                Enter Access Code
              </CardTitle>
              <CardDescription className="mt-2">
                {accessCodeSent
                  ? "Check your email for the 6-digit access code"
                  : "Request an access code to view this delivery"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!accessCodeSent ? (
              <div className="space-y-4">
                <Alert className="bg-blue-50 dark:bg-blue-900/20">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-xs">
                    For additional security, we'll send a verification code to <strong>{email}</strong>
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={requestAccessCode}
                  className="w-full"
                  disabled={accessCodeLoading}
                >
                  {accessCodeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Send Access Code
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <form onSubmit={verifyAccessCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessCode">6-Digit Code</Label>
                  <Input
                    id="accessCode"
                    type="text"
                    placeholder="123456"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    disabled={accessCodeLoading}
                    autoFocus
                    className="text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} remaining
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={accessCodeLoading || accessCode.length !== 6}
                >
                  {accessCodeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify Code
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={requestAccessCode}
                  disabled={accessCodeLoading}
                >
                  Resend Code
                </Button>
              </form>
            )}

            <Alert className="bg-yellow-50 dark:bg-yellow-900/20">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-xs">
                Access codes expire in 15 minutes
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Delivery not found
  if (!delivery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <CardTitle>Delivery Not Found</CardTitle>
            <CardDescription>
              This delivery link may be invalid, expired, or has been revoked
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check if expired
  const isExpired = delivery.status === "expired" || new Date(delivery.expires_at) < new Date();
  const isRevoked = delivery.status === "revoked";
  const viewLimitReached = delivery.current_views >= delivery.max_views;
  const downloadLimitReached = delivery.current_downloads >= delivery.max_downloads;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={Logo} alt="Sealdrop Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold">Sealdrop</h1>
              <p className="text-sm text-muted-foreground">Secure Document Delivery</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{delivery.title}</CardTitle>
                {delivery.message && (
                  <CardDescription className="mt-2 text-base">
                    {delivery.message}
                  </CardDescription>
                )}
              </div>
              {delivery.status === "active" && !isExpired && (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Status Alerts */}
            {isRevoked && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Access Revoked</AlertTitle>
                <AlertDescription>
                  This delivery has been revoked by the sender
                </AlertDescription>
              </Alert>
            )}

            {isExpired && !isRevoked && (
              <Alert variant="destructive">
                <Clock className="h-4 w-4" />
                <AlertTitle>Delivery Expired</AlertTitle>
                <AlertDescription>
                  This delivery expired {formatDistanceToNow(new Date(delivery.expires_at), { addSuffix: true })}
                </AlertDescription>
              </Alert>
            )}

            {!isExpired && !isRevoked && (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-300">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Active Delivery</span>
                    <span className="text-sm">
                      Expires {formatDistanceToNow(new Date(delivery.expires_at), { addSuffix: true })}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  Views
                </div>
                <p className="text-2xl font-bold">
                  {delivery.current_views} / {delivery.max_views}
                </p>
                {viewLimitReached && (
                  <p className="text-xs text-amber-600">Limit reached</p>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Download className="w-4 h-4" />
                  Downloads
                </div>
                <p className="text-2xl font-bold">
                  {delivery.current_downloads} / {delivery.max_downloads}
                </p>
                {downloadLimitReached && (
                  <p className="text-xs text-amber-600">Limit reached</p>
                )}
              </div>
            </div>

            {/* Files */}
            {delivery.files && delivery.files.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Files ({delivery.files.length})
                </h3>

                {delivery.files.map((file) => (
                  <Card key={file.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.original_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)} • {file.mime_type}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verifyFileIntegrity(file)}
                            disabled={verifying === file.id || !file.hash}
                          >
                            {verifying === file.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Shield className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => downloadFile(file)}
                            disabled={
                              downloading === file.id ||
                              isExpired ||
                              isRevoked ||
                              downloadLimitReached
                            }
                          >
                            {downloading === file.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Hash Display */}
                      {file.hash && (
                        <div className="bg-muted p-3 rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            <span className="text-xs font-medium">SHA-256 Hash</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs break-all font-mono bg-background p-2 rounded border">
                              {file.hash}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyHash(file.hash!)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Security Notice */}
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-900 dark:text-blue-300">
                Security & Transparency
              </AlertTitle>
              <AlertDescription className="text-blue-800 dark:text-blue-400">
                <ul className="text-xs space-y-1 mt-2">
                  <li>• Each file has a unique SHA-256 hash for integrity verification</li>
                  <li>• Downloaded files can be verified against the original hash</li>
                  <li>• All file accesses are logged for audit compliance</li>
                  <li>• This delivery will auto-destruct when limits are reached</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Powered by Sealdrop • Secure Temporary Document Delivery</p>
        </div>
      </div>
    </div>
  );
}
