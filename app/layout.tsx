import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Importamos Analytics de Vercel
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Actualizamos metadatos para mejorar la apariencia en iPhone
export const metadata: Metadata = {
  title: "Patriots Telemetry",
  description: "Patriots Command Center - Tactical Feed",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pats Telemetry",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Este componente activa el rastreo de Vercel */}
        <Analytics />
      </body>
    </html>
  );
}