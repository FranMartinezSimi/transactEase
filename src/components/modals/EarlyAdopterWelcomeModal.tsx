"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";
import { Sparkles, Check, Gift } from "lucide-react";

interface EarlyAdopterWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotNumber: number;
  totalSlots: number;
}

export function EarlyAdopterWelcomeModal({
  isOpen,
  onClose,
  slotNumber,
  totalSlots,
}: EarlyAdopterWelcomeModalProps) {
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    // Wait a bit for effect
    await new Promise((resolve) => setTimeout(resolve, 500));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-primary/20">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center animate-pulse-glow">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">
            ¡Felicidades! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Eres uno de los primeros en unirse a Sealdrop
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Slot Number Badge */}
          <div className="flex justify-center">
            <Badge variant="default" className="text-lg px-6 py-2">
              Early Adopter #{slotNumber} de {totalSlots}
            </Badge>
          </div>

          {/* Benefits */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold mb-4">
              <Gift className="h-5 w-5" />
              <span>Beneficios exclusivos:</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Plan gratuito de por vida</p>
                  <p className="text-sm text-muted-foreground">
                    Sin necesidad de tarjeta de crédito
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">5 entregas por mes</p>
                  <p className="text-sm text-muted-foreground">
                    Perfecto para validar el producto
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">1 GB de almacenamiento</p>
                  <p className="text-sm text-muted-foreground">
                    Archivos de hasta 300MB
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Auditoría completa incluida</p>
                  <p className="text-sm text-muted-foreground">
                    Tracking completo de todos los accesos
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Soporte prioritario</p>
                  <p className="text-sm text-muted-foreground">
                    Tu feedback da forma al producto
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <p className="text-sm text-muted-foreground text-center">
            Como early adopter, tu opinión es invaluable. Estamos aquí para
            escucharte y mejorar juntos.
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAccept}
            className="w-full"
            size="lg"
            disabled={isAccepting}
          >
            {isAccepting ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Activando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Comenzar a usar Sealdrop
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
