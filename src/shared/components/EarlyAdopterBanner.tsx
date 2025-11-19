"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Sparkles, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

interface EarlyAdopterAvailability {
  available: boolean;
  slotsRemaining: number;
  programActive: boolean;
}

interface EarlyAdopterBannerProps {
  currentPlan: "free" | "starter" | "pro" | "enterprise";
  isAdmin: boolean;
  onSlotClaimed?: () => void;
}

export function EarlyAdopterBanner({
  currentPlan,
  isAdmin,
  onSlotClaimed,
}: EarlyAdopterBannerProps) {
  const [availability, setAvailability] = useState<EarlyAdopterAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  async function fetchAvailability() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/early-adopter/availability");
      const data = await response.json();

      if (data.success) {
        setAvailability({
          available: data.available,
          slotsRemaining: data.slotsRemaining,
          programActive: data.programActive,
        });
      }
    } catch (error) {
      console.error("Error fetching early adopter availability:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleClaimSlot() {
    try {
      setIsClaiming(true);
      const response = await fetch("/api/early-adopter/claim", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "¡Slot de early adopter reclamado exitosamente!");
        if (onSlotClaimed) {
          onSlotClaimed();
        }
        // Refresh availability
        await fetchAvailability();
      } else {
        toast.error(data.error || "No se pudo reclamar el slot");
      }
    } catch (error) {
      console.error("Error claiming early adopter slot:", error);
      toast.error("Error al reclamar el slot");
    } finally {
      setIsClaiming(false);
    }
  }

  // Don't show banner if user is already on free plan (early adopter)
  if (currentPlan === "free") {
    return (
      <Card className="border-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Sparkles className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-foreground">
                  Eres Early Adopter
                </h3>
                <Badge className="bg-green-500">Free Forever</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Gracias por ser uno de los primeros en confiar en Sealdrop. Tu plan free se
                mantendrá activo indefinidamente como agradecimiento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show if program is not active or no slots available
  if (isLoading) {
    return (
      <Card className="border-2 border-primary/30">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm text-muted-foreground">Verificando disponibilidad...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!availability?.programActive || !availability?.available) {
    return null;
  }

  return (
    <Card className="border-2 border-purple-500/50 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Sparkles className="h-8 w-8 text-purple-500 flex-shrink-0 mt-1 animate-pulse" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-foreground">
                  🎉 Programa Early Adopter
                </h3>
                <Badge variant="destructive" className="animate-pulse">
                  <Clock className="h-3 w-3 mr-1" />
                  Solo {availability.slotsRemaining} slots restantes
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Sé uno de los primeros {50 - (availability.slotsRemaining || 0)} early adopters
                y obtén el <strong>plan Free de por vida</strong> (valor $15/mes).
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ 10 envíos por mes</li>
                <li>✅ 1GB de almacenamiento</li>
                <li>✅ Archivos hasta 10MB</li>
                <li>✅ Free para siempre (no expira)</li>
              </ul>
            </div>
          </div>

          {isAdmin && (
            <Button
              size="lg"
              onClick={handleClaimSlot}
              disabled={isClaiming}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reclamando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Reclamar Slot Gratis
                </>
              )}
            </Button>
          )}
        </div>

        {!isAdmin && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Solo los administradores pueden reclamar slots de early adopter
          </p>
        )}
      </CardContent>
    </Card>
  );
}
