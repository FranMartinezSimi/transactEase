"use client";

import { useState } from "react";
import { AuthenticatedLayout } from "@shared/components/AuthenticatedLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";
import { Check, Zap, Crown, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$19",
    period: "/month",
    description: "Perfect for small teams getting started",
    features: [
      "50 deliveries per month",
      "10 GB storage",
      "Up to 5 team members",
      "Complete audit trail",
      "Email support",
      "Auto-destruction",
      "2FA authentication",
    ],
    icon: Zap,
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For growing teams with higher volume",
    features: [
      "500 deliveries per month",
      "50 GB storage",
      "Up to 20 team members",
      "Complete audit trail",
      "Priority support",
      "Auto-destruction",
      "2FA authentication",
      "Advanced analytics",
      "Custom branding",
    ],
    icon: Crown,
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with custom needs",
    features: [
      "Unlimited deliveries",
      "500 GB storage",
      "Unlimited team members",
      "Complete audit trail",
      "Dedicated support",
      "Auto-destruction",
      "2FA authentication",
      "Advanced analytics",
      "Custom branding",
      "SLA guarantee",
      "Custom integrations",
    ],
    icon: Sparkles,
    highlighted: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (planId === "enterprise") {
      // Redirect to contact for enterprise
      window.location.href = "mailto:sales@sealdrop.xyz?subject=Enterprise Plan Inquiry";
      return;
    }

    setLoadingPlan(planId);

    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        // Redirect to Lemon Squeezy checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.message || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("[Pricing] Error:", error);
      toast.error("An error occurred");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your team. All plans include our core security features.
          </p>
        </div>

        {/* Early Adopter Notice */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/10 to-purple-500/10">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <div>
                <h4 className="font-semibold mb-1">Early Adopter Program</h4>
                <p className="text-sm text-muted-foreground">
                  The first 50 users get a free plan forever (10 deliveries/month).
                  If you're not an early adopter yet, upgrade to unlock more capacity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isLoading = loadingPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.highlighted
                    ? "border-primary shadow-lg scale-105"
                    : "border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-purple-600">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Icon
                      className={`h-8 w-8 ${
                        plan.highlighted ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isLoading}
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : plan.id === "enterprise" ? (
                      "Contact Sales"
                    ) : (
                      "Get Started"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ / Trust */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            All plans include bank-level encryption, complete audit logs, and auto-destruction.
          </p>
          <p className="mt-2">
            Cancel anytime. No hidden fees. Powered by Lemon Squeezy.
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
