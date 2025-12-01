"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthenticatedLayout } from "@shared/components/AuthenticatedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";
import { Progress } from "@shared/components/ui/progress";
import { Check, Crown, Zap, Loader2, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionData {
  plan: string;
  status: string;
  deliveries_limit: number;
  deliveries_used: number;
  storage_limit_gb: number;
  storage_used_gb: number;
  users_limit: number;
  ai_compliance_enabled: boolean;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [managingBilling, setManagingBilling] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const response = await fetch("/api/subscription");
      const data = await response.json();

      if (data.success) {
        setSubscription(data.subscription);
      } else {
        toast.error("Failed to load subscription");
      }
    } catch (error) {
      console.error("[Subscription] Error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const handleManageBilling = () => {
    // For now, redirect to pricing page
    // Later, you can integrate Lemon Squeezy customer portal
    router.push("/pricing");
  };

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "early_adopter":
        return (
          <Badge className="gap-1" variant="default">
            <Sparkles className="h-3 w-3" />
            Early Adopter
          </Badge>
        );
      case "starter":
        return <Badge variant="secondary">Starter</Badge>;
      case "pro":
        return (
          <Badge className="gap-1 bg-gradient-to-r from-primary to-purple-600">
            <Zap className="h-3 w-3" />
            Pro
          </Badge>
        );
      case "enterprise":
        return (
          <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-600">
            <Crown className="h-3 w-3" />
            Enterprise
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!subscription) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No subscription found</p>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  const deliveriesPercentage = (subscription.deliveries_used / subscription.deliveries_limit) * 100;
  const storagePercentage = (subscription.storage_used_gb / subscription.storage_limit_gb) * 100;

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Subscription</h2>
          <p className="text-muted-foreground">
            Manage your subscription and view usage
          </p>
        </div>

        {/* Current Plan */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Plan
                  {getPlanBadge(subscription.plan)}
                </CardTitle>
                <CardDescription>
                  {subscription.plan === "early_adopter"
                    ? "Free forever as an early adopter"
                    : "Your active subscription plan"}
                </CardDescription>
              </div>
              {subscription.plan !== "early_adopter" && subscription.plan !== "enterprise" && (
                <Button onClick={handleManageBilling}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage Billing
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Usage Stats */}
        <div className="grid gap-6 mb-6">
          {/* Deliveries Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Deliveries</CardTitle>
              <CardDescription>
                {subscription.deliveries_used} of {subscription.deliveries_limit} used this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={deliveriesPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {subscription.deliveries_limit - subscription.deliveries_used} deliveries remaining
              </p>
            </CardContent>
          </Card>

          {/* Storage Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Storage</CardTitle>
              <CardDescription>
                {subscription.storage_used_gb.toFixed(2)} GB of {subscription.storage_limit_gb} GB used
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={storagePercentage} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {(subscription.storage_limit_gb - subscription.storage_used_gb).toFixed(2)} GB remaining
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Plan Features */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span className="text-sm">
                Up to {subscription.deliveries_limit} deliveries per month
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span className="text-sm">
                {subscription.storage_limit_gb} GB storage
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span className="text-sm">
                Up to {subscription.users_limit} team {subscription.users_limit === 1 ? "member" : "members"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span className="text-sm">Complete audit trail</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span className="text-sm">Auto-destruction & expiration</span>
            </div>
            {subscription.ai_compliance_enabled && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">AI-powered compliance scanning</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade CTA (if not enterprise) */}
        {subscription.plan !== "enterprise" && subscription.plan !== "early_adopter" && (
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold mb-1">Need more deliveries?</h4>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Pro for 500 deliveries/month and advanced features
                  </p>
                </div>
                <Button onClick={handleUpgrade}>
                  Upgrade Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Early Adopter Special */}
        {subscription.plan === "early_adopter" && (
          <Card className="mt-6 border-primary/20 bg-gradient-to-br from-primary/10 to-purple-500/10">
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <div>
                  <h4 className="font-semibold mb-1">Early Adopter Benefits</h4>
                  <p className="text-sm text-muted-foreground">
                    Thank you for being an early supporter! Your plan is free forever.
                    Your feedback helps shape the future of Sealdrop.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
