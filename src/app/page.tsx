"use client";

import Link from "next/link";
import { useState } from "react";
import { WaitlistModal } from "@/components/waitlist-modal";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
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
                <span className="text-sm font-medium">Self-destructing documents</span>
              </div>

              {/* Title */}
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight animate-fade-in-up">
                Share Sensitive Documents{" "}
                <span className="gradient-text">With Complete Audit Trail</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in-up">
                Temporary links with auto-destruction, automatic encryption, and{" "}
                <span className="text-primary font-semibold">complete audit trail</span>.
                Perfect for sensitive documents that need access tracking.
              </p>

              {/* CTAs */}
              {/* <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up">
                <Link
                  href="/auth/register"
                  className="text-lg px-8 py-4 gradient-primary border-0 shadow-lg hover:shadow-xl transition-all rounded-lg text-white font-semibold"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/auth/login"
                  className="text-lg px-8 py-4 bg-card border border-border hover:bg-secondary transition-all rounded-lg text-foreground font-semibold"
                >
                  Sign In
                </Link>
              </div> */}

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>Bank-level encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>Complete access tracking</span>
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
                The Problem with Traditional Email & File Sharing
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-card p-8 rounded-xl border border-border hover:border-destructive/50 transition-all group">
                <div className="w-14 h-14 rounded-lg bg-destructive/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">No Control</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Emails stay in inboxes forever. Once sent, you lose all control.
                  Recipients can copy, forward, or leave them exposed without protection.
                </p>
              </div>

              <div className="bg-card p-8 rounded-xl border border-border hover:border-destructive/50 transition-all group">
                <div className="w-14 h-14 rounded-lg bg-destructive/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Eye className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">No Traceability</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Did the client view the contract? How many times? From where?
                  Without an audit trail, there's no way to prove compliance during audits.
                </p>
              </div>

              <div className="bg-card p-8 rounded-xl border border-border hover:border-destructive/50 transition-all group">
                <div className="w-14 h-14 rounded-lg bg-destructive/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Legal Risk</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Without evidence of who accessed and when, you can't comply with regulations
                  like GDPR, HIPAA, or corporate audits. Your company is at risk.
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
                TransactEase Solves the Root Problem
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

        {/* Features Section - AUDIT HIGHLIGHTED */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Complete Audit Trail: Our Differentiator
              </h2>
              <p className="text-xl text-muted-foreground">
                Track every access with complete transparency. Perfect for accountability and record-keeping.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Feature: Complete Audit */}
              <div className="bg-card p-8 rounded-xl border border-primary/50 hover:shadow-lg transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                  ⭐ EXCLUSIVE
                </div>
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Complete Audit Trail</h3>
                <p className="text-muted-foreground">
                  Timeline of every access: who (email), when (exact timestamp),
                  from where (IP address), what they did (viewed/downloaded).
                  CSV export ready for your records.
                </p>
              </div>

              {/* Feature: Password Protection */}
              <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Password Protection</h3>
                <p className="text-muted-foreground">
                  Add optional password protection to your documents.
                  Only recipients with the password can access the file, adding an extra layer of security.
                </p>
              </div>

              {/* Feature: IP Logging */}
              <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">IP Address Logging</h3>
                <p className="text-muted-foreground">
                  Every access logs the IP address and timestamp.
                  Track patterns and identify unexpected access from your audit trail.
                </p>
              </div>

              {/* Feature: Auto-Destruction */}
              <div className="bg-card p-8 rounded-xl border border-border hover:border-accent/50 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-lg gradient-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Flame className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Smart Auto-Destruction</h3>
                <p className="text-muted-foreground">
                  Expires by time (1h-30 days), view limit, or download limit.
                  You control exactly when and how the link expires. Supports files up to 300MB.
                </p>
              </div>

              {/* Feature: User Management */}
              <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Enterprise Management</h3>
                <p className="text-muted-foreground">
                  Admin creates users, views complete audit, configures limits.
                  Perfect for teams that need total transparency and compliance.
                </p>
              </div>

              {/* Feature: Reports */}
              <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileBarChart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Audit Reports</h3>
                <p className="text-muted-foreground">
                  Export complete access logs to CSV format.
                  Perfect for internal audits, security reviews, and record-keeping.
                </p>
              </div>

              {/* Feature: Encryption */}
              <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group col-span-1 md:col-span-2 lg:col-span-1">
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Automatic Encryption</h3>
                <p className="text-muted-foreground">
                  All files are encrypted before storage. The file NEVER goes through email.
                  Only a temporary link to a secure viewer.
                </p>
              </div>

              {/* Feature: Flexible Configuration */}
              <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all group col-span-1 md:col-span-2 lg:col-span-2">
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Flexible Configuration</h3>
                <p className="text-muted-foreground">
                  Admin configures file limits (up to 300MB), expiration ranges,
                  and security policies. No ridiculous limits like other services.
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
                Stop Risking Sensitive Information
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join professionals who protect confidential documents with auto-destruction
                and <span className="text-primary font-semibold">complete audit trail for accountability</span>.
              </p>


              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button
                  className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-lg shadow-lg hover:bg-primary/90 transition"
                  onClick={() => setIsModalOpen(true)}
                >
                  Join the Waitlist
                </button>
              </div>
              <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Smart auto-destruction
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Complete audit trail
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Password protection
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" /> CSV export
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
              © 2025 TransactEase. All rights reserved.
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="mailto:contact@transactease.com" className="hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
