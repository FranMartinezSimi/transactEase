import Link from "next/link";
import {
  Shield,
  Lock,
  FileCheck,
  Clock,
  Flame,
  Eye,
  AlertTriangle,
  Mail,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  MapPin,
  Activity,
  FileBarChart,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">TransactEase</span>
            </div>
            <Link
              href="/auth"
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32 gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6 animate-fade-in-up">
                <Flame className="h-4 w-4 text-accent animate-pulse-glow" />
                <span className="text-sm font-medium">Documentos que se autodestruyen</span>
              </div>

              {/* Title */}
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight animate-fade-in-up">
                Comparte Documentos Sensibles{" "}
                <span className="gradient-text">Con Auditoría Total</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in-up">
                Enlaces temporales con auto-destrucción, cifrado automático y{" "}
                <span className="text-primary font-semibold">auditoría forense completa</span>.
                Perfecto para compliance GDPR, HIPAA o documentos legales.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up">
                <Link
                  href="/auth"
                  className="text-lg px-8 py-4 gradient-primary border-0 shadow-lg hover:shadow-xl transition-all rounded-lg text-white font-semibold"
                >
                  Comenzar Gratis
                </Link>
                <Link
                  href="#features"
                  className="text-lg px-8 py-4 border-2 border-border hover:bg-card rounded-lg font-semibold transition-all"
                >
                  Ver Demo
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>Cifrado de nivel bancario</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>GDPR & HIPAA ready</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                El Problema con Email y File Sharing Tradicional
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-card p-8 rounded-xl border border-border hover:border-destructive/50 transition-all group">
                <div className="w-14 h-14 rounded-lg bg-destructive/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Sin Control</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Los emails quedan en inboxes para siempre. Una vez enviado, pierdes todo control.
                  El receptor puede copiarlo, reenviarlo o dejarlo expuesto sin protección.
                </p>
              </div>

              <div className="bg-card p-8 rounded-xl border border-border hover:border-destructive/50 transition-all group">
                <div className="w-14 h-14 rounded-lg bg-destructive/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Eye className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Sin Trazabilidad</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ¿El cliente vio el contrato? ¿Cuántas veces? ¿Desde dónde?
                  Sin audit trail, no hay forma de probar compliance en caso de auditoría.
                </p>
              </div>

              <div className="bg-card p-8 rounded-xl border border-border hover:border-destructive/50 transition-all group">
                <div className="w-14 h-14 rounded-lg bg-destructive/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Riesgo Legal</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Sin evidencia de quién accedió y cuándo, no puedes cumplir con regulaciones
                  como GDPR, HIPAA o auditorías corporativas. Tu empresa está en riesgo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                TransactEase Resuelve el Problema de Raíz
              </h2>
              <p className="text-xl text-muted-foreground">
                Documentos que se autodestruyen + <span className="text-primary font-semibold">Auditoría forense completa</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-6 hover:scale-110 transition-transform">
                  <Mail className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">1. Envía</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Sube tu documento y configura: quién puede verlo, cuándo expira,
                  límites de acceso. Todo queda registrado desde el inicio.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-6 hover:scale-110 transition-transform">
                  <Lock className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">2. Rastreo Total</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cada vista, descarga y acceso queda registrado con IP, ubicación,
                  timestamp y dispositivo. Auditoría forense automática.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl gradient-accent flex items-center justify-center mb-6 hover:scale-110 transition-transform">
                  <Flame className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">3. Se Autodestruye</h3>
                <p className="text-muted-foreground leading-relaxed">
                  El documento desaparece permanentemente después de ser visto, al expirar,
                  o si detecta actividad sospechosa. Log forense completo de TODO.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - AUDITORÍA DESTACADA */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Auditoría Forense: Nuestro Diferenciador
              </h2>
              <p className="text-xl text-muted-foreground">
                La competencia NO tiene esto. Perfecto para compliance y evidencia legal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Feature: Auditoría Completa */}
              <div className="bg-card p-8 rounded-xl border border-primary/50 hover:shadow-lg transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                  ⭐ EXCLUSIVO
                </div>
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Auditoría Forense Completa</h3>
                <p className="text-muted-foreground">
                  Timeline visual de cada acceso: quién (email), cuándo (timestamp exacto),
                  desde dónde (IP + ciudad), qué hizo (vio/descargó), por cuánto tiempo.
                  Export a CSV para compliance.
                </p>
              </div>

              {/* Feature: Detección de Anomalías */}
              <div className="bg-card p-8 rounded-xl border border-warning/50 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-lg bg-warning/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Activity className="h-8 w-8 text-warning" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Detección de Anomalías</h3>
                <p className="text-muted-foreground">
                  Alertas automáticas si detecta: múltiples IPs, acceso muy rápido (posible bot),
                  VPN/proxy, o acceso fuera de horario. Flag visual de actividad sospechosa.
                </p>
              </div>

              {/* Feature: Geolocalización */}
              <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Rastreo de Ubicación</h3>
                <p className="text-muted-foreground">
                  Cada acceso registra IP y ubicación aproximada (país/ciudad).
                  Detecta si el documento fue reenviado a alguien en otro país.
                </p>
              </div>

              {/* Feature: Auto-Destrucción */}
              <div className="bg-card p-8 rounded-xl border border-border hover:border-accent/50 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-lg gradient-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Flame className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Auto-Destrucción Inteligente</h3>
                <p className="text-muted-foreground">
                  Expira por tiempo (1h-30 días), límite de vistas, límite de descargas,
                  o intento de hackeo. Configurable hasta 300MB por archivo.
                </p>
              </div>

              {/* Feature: Gestión de Usuarios */}
              <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Gestión Empresarial</h3>
                <p className="text-muted-foreground">
                  El admin crea usuarios, ve auditoría completa, configura límites.
                  Perfecto para equipos que necesitan transparencia total y compliance.
                </p>
              </div>

              {/* Feature: Reportes */}
              <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileBarChart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Reportes de Compliance</h3>
                <p className="text-muted-foreground">
                  Export completo en CSV con todos los eventos. Listo para auditorías
                  GDPR, HIPAA, SOX o cualquier requerimiento regulatorio.
                </p>
              </div>

              {/* Feature: Cifrado */}
              <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group col-span-1 md:col-span-2 lg:col-span-1">
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Cifrado Automático</h3>
                <p className="text-muted-foreground">
                  Todos los archivos se cifran antes de almacenarse. El archivo NUNCA va por email.
                  Solo un link temporal a viewer seguro.
                </p>
              </div>

              {/* Feature: Sin límites de tamaño absurdos */}
              <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group col-span-1 md:col-span-2 lg:col-span-2">
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Configuración Flexible</h3>
                <p className="text-muted-foreground">
                  Admin configura límites de archivo (hasta 300MB), rangos de expiración,
                  y políticas de seguridad. Sin límites ridículos como otros servicios.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center glass rounded-2xl p-12 border-2 border-primary/20 shadow-2xl">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Deja de Arriesgar Información Sensible
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Únete a profesionales que protegen documentos confidenciales con auto-destrucción
                y <span className="text-primary font-semibold">auditoría forense que salva auditorías</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  href="/auth"
                  className="text-lg px-8 py-4 gradient-primary border-0 shadow-lg hover:shadow-xl transition-all rounded-lg text-white font-semibold"
                >
                  Empezar Gratis Ahora
                </Link>
                <Link
                  href="mailto:contacto@transactease.com"
                  className="text-lg px-8 py-4 border-2 border-primary hover:bg-primary/5 rounded-lg font-semibold transition-all"
                >
                  Hablar con Ventas
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Auto-destrucción inteligente
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Audit trail forense
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Detección de anomalías
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Setup en 2 minutos
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">TransactEase</span>
            </div>

            <div className="text-sm text-muted-foreground">
              © 2025 TransactEase. Todos los derechos reservados.
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
              <a href="#" className="hover:text-primary transition-colors">Términos</a>
              <a href="mailto:contacto@transactease.com" className="hover:text-primary transition-colors">Contacto</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
