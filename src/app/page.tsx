"use client";

import { useState } from "react";
import { WaitlistModal } from "@/components/waitlist-modal";
import { FAQSection } from "@/components/faq-section";
import { ProductShowcase } from "@/components/product-showcase";
import { trackCTAClick } from "@/lib/analytics";
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
  Activity,
  FileBarChart,
  LogIn,
} from "lucide-react";
import Logo from "../../public/Sealdrop.svg";
import Image from 'next/image'
import { Button } from "@/components/ui/button";
import Link from "next/link";


export default function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container mx-auto px-2 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src={Logo} alt="Sealdrop Logo" className="h-30 w-30" />
              <span className="text-2xl font-bold text-foreground">Sealdrop</span>
            </div>
            <div className="flex items-center  w-1/12 h-14 rounded-lg">
              <Button variant="default" asChild className="p-4 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-4 w-full rounded-lg h-full">
                <Link href="/auth/login">
                  <LogIn className="h-4 w-4 text-primary-foreground hover:text-primary-foreground/80" />
                  <span className="text-sm font-medium text-primary-foreground hover:text-primary-foreground/80">Login</span>
                </Link></Button>
            </div>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive border border-destructive/20 mb-6 animate-fade-in-up">
                <Flame className="h-4 w-4 text-destructive animate-pulse-glow" />
                <span className="text-sm font-medium">Auto-destructs after failed login attempts</span>
              </div>

              {/* Title */}
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight animate-fade-in-up">
                Secure file sending{" "}
                <span className="gradient-text">With full audit-trail.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in-up">
                Track who accessed your files, when, where, and <span className="text-primary font-semibold">how many times they tried</span>.<br />
                Recipients get one-time credentials. Failed attempts? Everything self-destructs.
              </p>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>Auto-destructs after failed attempts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>One-time temporary credentials</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>Mandatory IP logging (even with VPN)</span>
                </div>
              </div>
              <div className="mt-8 animate-fade-in-up">
                <button
                  onClick={() => {
                    trackCTAClick('hero');
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-10 py-5 rounded-lg bg-primary text-primary-foreground font-bold text-lg border border-primary/20 transition-all duration-300 hover:bg-primary/90 hover:border-primary/30 shadow-2xl hover:shadow-xl hover:scale-105"
                >
                  Join the Waitlist
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                The Problem with Email & Traditional File Sharing
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
              <div className="bg-card p-10 rounded-2xl border-2 border-border hover:border-destructive/50 transition-all group">
                <div className="w-16 h-16 rounded-xl bg-destructive/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <XCircle className="h-9 w-9 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">No Control or Visibility</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Once you hit send, you lose all control. Files live in inboxes forever.
                  You can't track who viewed it, when, or from where. Zero accountability.
                </p>
              </div>

              <div className="bg-card p-10 rounded-2xl border-2 border-border hover:border-destructive/50 transition-all group">
                <div className="w-16 h-16 rounded-xl bg-destructive/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-9 w-9 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Compliance Nightmare</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Without audit trails, you can't prove compliance with GDPR, HIPAA, or SOC2.
                  One data breach audit and you're exposed with no evidence of due diligence.
                </p>
              </div>
            </div>

            {/* Early CTA */}
            <div className="max-w-2xl mx-auto mt-16 text-center">
              <p className="text-xl text-muted-foreground mb-6">
                Sound familiar? There's a better way.
              </p>
              <button
                onClick={() => {
                  trackCTAClick('problem_section');
                  setIsModalOpen(true);
                }}
                className="px-8 py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
              >
                Get Early Access
              </button>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Sealdrop Solves the Root Problem
              </h2>
              <p className="text-xl text-muted-foreground">
                Self-destructing documents + <span className="text-primary font-semibold">complete audit trail</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-6 hover:scale-110 transition-transform">
                  <Mail className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">1. Send</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Upload your document and configure: who can view it, when it expires,
                  access limits. Everything is logged from the start.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-6 hover:scale-110 transition-transform">
                  <Lock className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">2. Complete Tracking</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every view and download is logged with IP address, exact timestamp,
                  and user email. Complete audit trail you can export.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl gradient-accent flex items-center justify-center mb-6 hover:scale-110 transition-transform">
                  <Flame className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">3. Self-Destructs</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The document disappears permanently after reaching view/download limits
                  or upon expiration. Complete audit log of every access.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Product Showcase with Screenshots */}
        <ProductShowcase />

        {/* Features Section - Your Real Differentiators */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Security Features That Don't Exist Anywhere Else
              </h2>
              <p className="text-xl text-muted-foreground">
                Zero-trust access control meets forensic-grade audit trails
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Feature 1: Zero-Trust Temporary Access */}
              <div className="bg-card p-10 rounded-2xl border-2 border-primary/50 hover:shadow-2xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                  ⭐ UNIQUE TO SEALDROP
                </div>
                <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="h-9 w-9 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Zero-Trust Temporary Access</h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                  Recipients get <strong>single-use credentials</strong> with 4-digit tokens. No password recovery. No second chances.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Auto-destructs after 2-3 failed login attempts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Temporary user + token destroyed on failure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Failed attempts logged in audit trail</span>
                  </li>
                </ul>
              </div>

              {/* Feature 2: Forensic Audit Trail */}
              <div className="bg-card p-10 rounded-2xl border-2 border-border hover:border-primary/50 hover:shadow-2xl transition-all group">
                <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileCheck className="h-9 w-9 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Forensic-Grade Audit Trail</h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                  Track everything. Export everything. Prove everything.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Who (email), when (timestamp), where (IP)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Successful + failed access attempts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>CSV export for GDPR/HIPAA/SOC2 compliance</span>
                  </li>
                </ul>
              </div>

              {/* Feature 3: Mandatory IP Logging */}
              <div className="bg-card p-10 rounded-2xl border-2 border-border hover:border-primary/50 hover:shadow-2xl transition-all group">
                <div className="w-16 h-16 rounded-xl gradient-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Activity className="h-9 w-9 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Mandatory IP Logging</h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                  <strong>No bypass.</strong> Senders must grant geolocation permission or cannot send.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Works even with VPN (logs visible IP)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Compliance-first design for regulated industries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Track access patterns and anomalies</span>
                  </li>
                </ul>
              </div>

              {/* Feature 4: Smart Self-Destruction */}
              <div className="bg-card p-10 rounded-2xl border-2 border-border hover:border-accent/50 hover:shadow-2xl transition-all group">
                <div className="w-16 h-16 rounded-xl gradient-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Flame className="h-9 w-9 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Multi-Trigger Self-Destruction</h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                  Documents destroy themselves when ANY condition is met.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span>Time-based (1 hour to 30 days)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span>View/download limits reached</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span><strong>Failed authentication attempts (unique)</strong></span>
                  </li>
                </ul>
              </div>

              {/* Feature 5: Verified Sender Identity */}
              <div className="bg-card p-10 rounded-2xl border-2 border-border hover:border-primary/50 hover:shadow-2xl transition-all group">
                <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="h-9 w-9 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Verified Sender Identity</h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                  Google OAuth for senders. Anonymous zero-knowledge tokens for recipients.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Senders authenticated via Google OAuth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Bank-level AES-256 encryption</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Files never pass through email servers</span>
                  </li>
                </ul>
              </div>

              {/* Feature 6: Enterprise Management */}
              <div className="bg-card p-10 rounded-2xl border-2 border-border hover:border-primary/50 hover:shadow-2xl transition-all group">
                <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Clock className="h-9 w-9 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Simple UX, Enterprise Power</h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                  Share files in seconds. Admin controls for teams.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Up to 300MB per file</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Team management & policy configuration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Full-text search across audit logs</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center glass rounded-2xl p-12 border-2 border-primary/20 shadow-2xl">
              {/* Urgency badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent mb-6">
                <Clock className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-bold">Limited early access spots available</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Ready to Secure Your Documents?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Be among the first to get <span className="text-primary font-semibold">complete audit trail</span> and
                self-destructing links for your sensitive files.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button
                  className="px-10 py-4 rounded-lg bg-primary text-primary-foreground font-bold text-xl shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
                  onClick={() => {
                    trackCTAClick('final_cta');
                    setIsModalOpen(true);
                  }}
                >
                  Secure My Spot
                </button>
              </div>
              <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Launch: January 2025
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" /> No credit card needed
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Early adopter benefits
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Image src={Logo} alt="Sealdrop Logo" className="h-15 w-15" />
              <span className="text-lg font-bold text-foreground">Sealdrop</span>
            </div>

            <div className="text-sm text-muted-foreground">
              © 2025 Sealdrop. All rights reserved.
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="mailto:contact@sealdrop.com" className="hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
