import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "TransactEase - Documentos Seguros con Auditoría Forense",
  description: "Comparte documentos sensibles con auto-destrucción, cifrado automático y auditoría forense completa. Perfecto para compliance GDPR, HIPAA y más.",
  keywords: ["documentos seguros", "auditoría forense", "auto-destrucción", "compliance", "GDPR", "HIPAA", "archivo temporal"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
