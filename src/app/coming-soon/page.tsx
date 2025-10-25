"use client"

import Link from "next/link";
import { useState } from "react";
import { Shield, Rocket, Bell, CheckCircle2 } from "lucide-react";
import { WaitlistModal } from "@/components/waitlist-modal";
import Image from "next/image";
import Logo from "../../../public/Sealdrop.svg";

export default function ComingSoonPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Image src={Logo} alt="Sealdrop Logo" className="h-30 w-30" />
          <span className="text-3xl font-bold text-foreground">Seladrop</span>
        </div>

        {/* Main Content */}
        <div className="glass rounded-2xl p-12 border-2 border-primary/20 shadow-2xl text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow">
            <Rocket className="h-10 w-10 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Coming Soon
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground mb-8">
            We're building something incredible.
            <br />
            <span className="text-primary font-semibold">
              Secure documents with complete forensic audit.
            </span>
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Self-Destruction</h3>
                <p className="text-sm text-muted-foreground">
                  Temporary links that expire automatically
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Forensic Audit</h3>
                <p className="text-sm text-muted-foreground">
                  Complete timeline of every access with IP and location
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Compliance</h3>
                <p className="text-sm text-muted-foreground">
                  GDPR, HIPAA ready with exports for audits
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Enterprise Management</h3>
                <p className="text-sm text-muted-foreground">
                  Admin creates users and configures policies
                </p>
              </div>
            </div>
          </div>

          {/* Early Access CTA */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Want to be among the first?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Register for early access and launch notifications.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-block px-6 py-3 gradient-primary rounded-lg text-white font-semibold hover:shadow-lg transition-all"
            >
              Request Early Access
            </button>
          </div>

          <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

          {/* Back to Home */}
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to home
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Meanwhile, learn more about Sealdrop on our{" "}
          <Link href="/" className="text-primary hover:underline">
            main page
          </Link>
        </p>
      </div>
    </div>
  );
}
