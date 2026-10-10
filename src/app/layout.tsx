import type { Metadata, Viewport } from "next";
import { Klee_One, Zen_Maru_Gothic } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

// Klee One: la scrittura a mano dei quaderni giapponesi, per i titoli.
// Zen Maru Gothic: tondo e morbido, per testo, bottoni e logo.
const klee = Klee_One({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-klee",
  display: "swap",
});
const zen = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-zen",
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
  themeColor: "#f5f0e6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${klee.variable} ${zen.variable}`}>
      <body className="min-h-dvh antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
