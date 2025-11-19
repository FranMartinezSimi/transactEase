"use client";

import { useEffect, useState } from "react";
import { AuthenticatedLayout } from "@/shared/components/AuthenticatedLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import {
  Loader2,
  Check,
  Crown,
  Zap,
  Users,
  HardDrive,
  FileText,
  Shield,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@features/auth";

interface Subscription {
  id?: string;
  organization_id?: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  status: string;
  max_deliveries_per_month: number;
  max_storage_gb: number;
  max_users: number;
  max_file_size: number;
  ai_compliance_enabled: boolean;
  deliveries_this_month: number;
  storage_used_gb: number;
  trial_ends_at?: string;
  current_period_start?: string;
  current_period_end?: string;
  canceled_at?: string;
}

const PLAN_FEATURES = {
  free: {
    name: "Free",
    price: "$0",
    description: "Plan gratuito (legacy)",
    icon: FileText,
    color: "text-gray-500",
    features: [
      "1 usuario",
      "10 envíos por mes",
      "1GB de almacenamiento",
      "Archivos hasta 10MB",
      "Funciones básicas",
    ],
  },
  starter: {
    name: "Starter",
    price: "$15",
    description: "Para empezar",
    icon: FileText,
    color: "text-green-500",
    features: [
      "3 usuarios incluidos",
      "50 envíos por mes",
      "5GB de almacenamiento",
      "Archivos hasta 25MB",
      "Expiración automática",
      "Código de acceso 2FA",
      "Usuarios adicionales: $7/mes",
      "Trial 14 días gratis",
    ],
  },
  pro: {
    name: "Professional",
    price: "$59",
    description: "Para equipos profesionales",
    icon: Zap,
    color: "text-blue-500",
    features: [
      "5 usuarios incluidos",
      "200 envíos por mes",
      "20GB de almacenamiento",
      "Archivos hasta 100MB",
      "Todo de Starter, más:",
      "Compliance AI básico",
      "Reportes de auditoría",
      "Usuarios adicionales: $12/mes",
      "Soporte prioritario",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom",
    description: "Para grandes organizaciones",
    icon: Crown,
    color: "text-purple-500",
    features: [
      "Usuarios ilimitados",
      "Envíos ilimitados",
      "Almacenamiento ilimitado",
      "Archivos hasta 500MB",
      "Todo de Professional, más:",
      "Compliance AI avanzado",
      "SSO personalizado",
      "Soporte 24/7 dedicado",
      "SLA garantizado 99.9%",
      "Account Manager",
      "Onboarding personalizado",
    ],
  },
};

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const { profile } = useProfile();
  const isAdmin = profile?.role === "admin" || profile?.role === "owner";

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/subscription");
      const data = await response.json();

      if (data.success && data.subscription) {
        setSubscription(data.subscription);
      } else {
        toast.error("Failed to load subscription");
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      toast.error("Failed to load subscription");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!subscription) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">No subscription found</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  const currentPlan = PLAN_FEATURES[subscription.plan as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.starter;
  const deliveriesPercent =
    (subscription.deliveries_this_month / subscription.max_deliveries_per_month) * 100;
  const storagePercent = (subscription.storage_used_gb / subscription.max_storage_gb) * 100;

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suscripción y Planes</h1>
          <p className="text-muted-foreground">
            Gestiona tu plan y monitorea el uso de recursos
          </p>
        </div>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <currentPlan.icon className={`h-6 w-6 ${currentPlan.color}`} />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Plan {currentPlan.name}
                    <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                      {subscription.status === "active" ? "Activo" : subscription.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{currentPlan.description}</CardDescription>
                </div>
              </div>
              {isAdmin && subscription.plan !== "enterprise" && (
                <Button>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Mejorar Plan
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Envíos este mes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {subscription.deliveries_this_month} / {subscription.max_deliveries_per_month}
              </div>
              <Progress value={deliveriesPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round(deliveriesPercent)}% utilizado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {subscription.storage_used_gb.toFixed(2)}GB / {subscription.max_storage_gb}GB
              </div>
              <Progress value={storagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round(storagePercent)}% utilizado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Límites</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usuarios máximos:</span>
                  <span className="font-medium">{subscription.max_users}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tamaño archivo:</span>
                  <span className="font-medium">{subscription.max_file_size}MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Compliance:</span>
                  <span className="font-medium">
                    {subscription.ai_compliance_enabled ? "Sí" : "No"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legacy Free Plan Notice */}
        {subscription.plan === "free" && (
          <Card className="border-2 border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Sparkles className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    Actualiza tu plan para más funcionalidades
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Estás en el plan gratuito legacy. Actualiza para obtener más envíos, almacenamiento y funciones avanzadas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Cards */}
        {isAdmin && (
          <>
            <div className="mt-4">
              <h2 className="text-2xl font-bold mb-2">Planes Disponibles</h2>
              <p className="text-muted-foreground mb-6">
                Elige el plan que mejor se adapte a las necesidades de tu equipo
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(PLAN_FEATURES)
                .filter(([planKey]) => planKey !== "free") // Exclude legacy free plan
                .map(([planKey, plan]) => {
                const isCurrent = planKey === subscription.plan;
                const PlanIcon = plan.icon;

                return (
                  <Card
                    key={planKey}
                    className={isCurrent ? "border-primary border-2" : ""}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <PlanIcon className={`h-5 w-5 ${plan.color}`} />
                        </div>
                        {isCurrent && (
                          <Badge variant="default">Plan Actual</Badge>
                        )}
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="text-sm">{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        {planKey !== "enterprise" && (
                          <span className="text-muted-foreground">/mes</span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={isCurrent ? "outline" : "default"}
                        disabled={isCurrent}
                      >
                        {isCurrent
                          ? "Plan Actual"
                          : planKey === "enterprise"
                            ? "Contactar Ventas"
                            : "Mejorar a " + plan.name}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Non-admin message */}
        {!isAdmin && (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Solo los administradores pueden gestionar la suscripción
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
