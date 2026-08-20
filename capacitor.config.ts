import type { CapacitorConfig } from "@capacitor/cli";

/**
 * L'app nativa (iOS/Android) è un wrapper della web app pubblicata:
 * un solo deployment serve web, PWA e store.
 *
 * Imposta CAP_SERVER_URL all'URL di produzione prima di `npx cap sync`,
 * es. CAP_SERVER_URL=https://colora.example.com npx cap sync
 */
const config: CapacitorConfig = {
  appId: "com.colora.app",
  appName: "Colora",
  webDir: "public",
  server: {
    url: process.env.CAP_SERVER_URL ?? "https://localhost:3000",
    cleartext: false,
  },
};

export default config;
