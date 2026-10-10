import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

// Fredoka per titoli e logo (tondo, da cartone), Nunito per il testo.
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

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
    <html lang="it" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="min-h-dvh antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
