import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Colora — disegni da colorare per bambini",
  description:
    "Scrivi cosa vuoi disegnare e colora con un tocco: disegni da colorare generati per i più piccoli.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Colora",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffce3e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className="min-h-dvh antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
