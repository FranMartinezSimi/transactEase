import Link from "next/link";
import { Shield, Rocket, Bell, CheckCircle2 } from "lucide-react";

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield className="h-12 w-12 text-primary" />
          <span className="text-3xl font-bold text-foreground">TransactEase</span>
        </div>

        {/* Main Content */}
        <div className="glass rounded-2xl p-12 border-2 border-primary/20 shadow-2xl text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow">
            <Rocket className="h-10 w-10 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Próximamente
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground mb-8">
            Estamos construyendo algo increíble.
            <br />
            <span className="text-primary font-semibold">
              Documentos seguros con auditoría forense completa.
            </span>
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Auto-Destrucción</h3>
                <p className="text-sm text-muted-foreground">
                  Enlaces temporales que expiran automáticamente
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Auditoría Forense</h3>
                <p className="text-sm text-muted-foreground">
                  Timeline completo de cada acceso con IP y ubicación
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Compliance</h3>
                <p className="text-sm text-muted-foreground">
                  GDPR, HIPAA ready con exports para auditorías
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Gestión Empresarial</h3>
                <p className="text-sm text-muted-foreground">
                  Admin crea usuarios y configura políticas
                </p>
              </div>
            </div>
          </div>

          {/* Early Access CTA */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">¿Quieres ser de los primeros?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Regístrate para acceso anticipado y notificaciones de lanzamiento.
            </p>
            <a
              href="mailto:contacto@transactease.com?subject=Early Access Request"
              className="inline-block px-6 py-3 gradient-primary rounded-lg text-white font-semibold hover:shadow-lg transition-all"
            >
              Solicitar Early Access
            </a>
          </div>

          {/* Back to Home */}
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Mientras tanto, conoce más sobre TransactEase en nuestra{" "}
          <Link href="/" className="text-primary hover:underline">
            página principal
          </Link>
        </p>
      </div>
    </div>
  );
}
