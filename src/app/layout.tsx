import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import GoogleAnalytics from "./GoogleAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sealdrop - Secure Documents with Complete Audit Trail",
  icons: {
    icon: "/Sealdrop.svg",
  },
  description: "Share sensitive documents with self-destruction, automatic encryption, and complete audit trail. Perfect for sensitive documents that need access tracking.",
  keywords: ["secure documents", "audit trail", "self-destruction", "access tracking", "temporary file", "document tracking", "password protection", "encrypted sharing"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        {children}
        <Analytics />
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            },
          }}
        />
      </body>
    </html>
  );
}
