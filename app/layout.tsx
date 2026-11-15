import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Semi_Condensed } from "next/font/google";
import type { ReactNode } from "react";
import { AudioUnlock } from "@/components/AudioUnlock";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowSemi = Barlow_Semi_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-barlow-semi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sale — Cobro CoDi",
  description: "Punto de venta con cobro CoDi vía pey",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Sale",
  },
};

export const viewport: Viewport = {
  themeColor: "#1D3C8F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <html lang="es-MX" className={`${barlow.variable} ${barlowSemi.variable}`}>
      <body className="min-h-dvh bg-fondo font-sans text-tinta antialiased">
        <AudioUnlock />
        {children}
      </body>
    </html>
  );
}
