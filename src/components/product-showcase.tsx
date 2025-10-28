"use client"

import * as React from "react";
import Image from 'next/image';
import { FileCheck, Upload, Activity, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { trackScreenshotClick } from "@/lib/analytics";

const screenshots = [
  {
    src: "/screenshoots/dashboard.png",
    title: "Dashboard Overview",
    description: "Track all your shared documents in one place",
    icon: Activity,
  },
  {
    src: "/screenshoots/send_document.png",
    title: "Share Documents",
    description: "Simple upload with powerful controls",
    icon: Upload,
  },
  {
    src: "/screenshoots/audit.png",
    title: "Complete Audit Trail",
    description: "Every access logged with full details",
    icon: FileCheck,
    featured: true,
  },
  {
    src: "/screenshoots/access_control.png",
    title: "Access Control",
    description: "Configure expiration and security settings",
    icon: ShieldCheck,
  },
];

export function ProductShowcase() {
  const [selectedImage, setSelectedImage] = React.useState<number | null>(null);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            See It In Action
          </h2>
          <p className="text-xl text-muted-foreground mb-6">
            Complete control and transparency over your sensitive documents
          </p>

          {/* Disclaimer */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Design mockups - Not the final product
            </span>
          </div>
        </div>

        {/* Screenshots Grid */}
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {screenshots.map((screenshot, index) => {
              const Icon = screenshot.icon;
              return (
                <Card
                  key={index}
                  className={cn(
                    "transition-all duration-300 cursor-pointer hover:shadow-2xl group",
                    screenshot.featured && "ring-2 ring-primary"
                  )}
                  onClick={() => {
                    trackScreenshotClick(screenshot.title);
                    setSelectedImage(index);
                  }}
                >
                  <CardContent className="p-5">
                    {/* Icon & Title */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        screenshot.featured ? "bg-primary/20" : "bg-muted"
                      )}>
                        <Icon className={cn(
                          "h-6 w-6",
                          screenshot.featured ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground text-base">
                          {screenshot.title}
                        </h3>
                        {screenshot.featured && (
                          <span className="text-xs text-primary font-semibold">
                            ⭐ Our Differentiator
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Screenshot */}
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-muted">
                      <Image
                        src={screenshot.src}
                        alt={screenshot.title}
                        fill
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mt-4">
                      {screenshot.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Click hint */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Click any image to view full size
          </p>
        </div>

        {/* Modal */}
        {selectedImage !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-7xl w-full max-h-[90vh] bg-card rounded-2xl overflow-hidden border-2 border-primary/20">
              {/* Close button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-background/80 hover:bg-background text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Image */}
              <div className="relative w-full h-full min-h-[60vh]">
                <Image
                  src={screenshots[selectedImage].src}
                  alt={screenshots[selectedImage].title}
                  fill
                  className="object-contain"
                  quality={100}
                />
              </div>

              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm p-6 border-t border-border">
                <div className="flex items-center gap-3">
                  {React.createElement(screenshots[selectedImage].icon, {
                    className: "h-6 w-6 text-primary"
                  })}
                  <div>
                    <h3 className="font-bold text-foreground text-lg">
                      {screenshots[selectedImage].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {screenshots[selectedImage].description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA below showcase */}
        <div className="max-w-2xl mx-auto text-center mt-12">
          <p className="text-lg text-muted-foreground mb-4">
            Ready to take control of your sensitive documents?
          </p>
        </div>
      </div>
    </section>
  );
}
