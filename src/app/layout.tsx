import type { Metadata, Viewport } from "next";
import { Bagel_Fat_One, Baloo_2, Nunito } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

// Bagel Fat One solo per il logo, Baloo 2 per i titoli (tondo e deciso,
// leggibile anche da chi impara a leggere), Nunito per il testo.
const bagel = Bagel_Fat_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bagel",
  display: "swap",
});
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
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
  themeColor: "#ffd23f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${bagel.variable} ${baloo.variable} ${nunito.variable}`}>
      <body className="min-h-dvh antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
