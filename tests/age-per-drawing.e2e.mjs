// L'età si sceglie a ogni creazione, insieme al prompt, e resta legata
// al disegno: riaprendolo tornano gli strumenti giusti.
// Richiede l'app avviata: npm run build && npm run start -- -p 3125
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-Draw/d6109a3d-4303-5f95-aa7c-4b659481af54/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
p.on("pageerror", e => console.log("PAGEERROR:", String(e).slice(0,250)));

await p.goto("http://localhost:3125/", { waitUntil: "networkidle" });

// 1) la scelta dell'età è nel modulo di creazione, ogni volta
const visibile = await p.getByText(/Chi colora questo disegno/).isVisible();
console.log("1 scelta età nel modulo :", visibile, "(atteso true)");
await p.screenshot({ path: `${OUT}/ui-eta-nel-form.png`, fullPage: true });

const strumenti = async () => p.evaluate(() => ({
  colori: document.querySelectorAll("button[aria-label^='Colore']").length,
  effetti: document.querySelectorAll("button[aria-label^='Effetto']").length,
  mano: document.querySelectorAll("button[aria-label*='mano libera']").length,
}));

// 2) creo scegliendo 2-3 anni
await p.getByRole("button", { name: /2-3 anni/ }).click();
await p.getByRole("button", { name: "🦕 dinosauro" }).click();
await p.getByRole("button", { name: "Crea!" }).click();
await p.waitForURL("**/color/**", { timeout: 60000 });
await p.waitForSelector("[data-colorable='1']");
console.log("2 disegno per 2-3 anni  :", JSON.stringify(await strumenti()), "(attesi 8 colori, 0, 0)");

// 3) torno e ne creo uno per 7+
await p.getByRole("link", { name: /Torna ai disegni/i }).click();
await p.waitForURL(u => !u.pathname.startsWith("/color"));
await p.getByRole("button", { name: /7 anni/ }).click();
await p.getByRole("button", { name: "🚀 razzo" }).click();
await p.getByRole("button", { name: "Crea!" }).click();
await p.waitForURL("**/color/**", { timeout: 60000 });
await p.waitForSelector("[data-colorable='1']");
console.log("3 disegno per 7+        :", JSON.stringify(await strumenti()), "(attesi 16 colori, 1, 1)");

// 4) riapro il PRIMO disegno: deve tornare in modalità 2-3 anni
await p.getByRole("link", { name: /Torna ai disegni/i }).click();
await p.waitForURL(u => !u.pathname.startsWith("/color"));
const miei = p.locator("section", { hasText: "I tuoi disegni" }).locator("a");
await miei.last().click();
await p.waitForURL("**/color/**");
await p.waitForSelector("[data-colorable='1']");
console.log("4 riapro il 1° disegno  :", JSON.stringify(await strumenti()), "(attesi 8 colori, 0, 0: l'età resta col disegno)");
await b.close();
