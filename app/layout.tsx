import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

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
  themeColor: "#0f6b4c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <html lang="es-MX">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
