// Età di chi disegna: domanda al primo avvio, scelta che sparisce dopo,
// e strumenti che cambiano davvero tra 2-3 anni e 7+.
// Richiede l'app avviata: npm run build && npm run start -- -p 3124
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-Draw/d6109a3d-4303-5f95-aa7c-4b659481af54/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
p.on("pageerror", e => console.log("PAGEERROR:", String(e).slice(0,250)));

// 1) primo avvio: la domanda deve comparire
await p.goto("http://localhost:3124/", { waitUntil: "networkidle" });
const domanda = await p.getByText(/Quanti anni ha chi disegna/).isVisible().catch(() => false);
console.log("1 domanda al primo avvio :", domanda, "(atteso true)");
await p.screenshot({ path: `${OUT}/ui-eta-onboarding.png`, fullPage: true });

// 2) scelgo 2-3 anni
await p.getByRole("button", { name: /2-3 anni/ }).click();
await p.waitForTimeout(1200);
const ancora = await p.getByText(/Quanti anni ha chi disegna/).isVisible().catch(() => false);
console.log("2 domanda dopo la scelta :", ancora, "(atteso false)");

// 3) la coloritura deve rispecchiare la scelta: 8 colori, niente effetti, niente matita
await p.locator("section", { hasText: "Disegni di esempio" }).locator("button:has(svg)").first().click();
await p.waitForURL("**/color/**");
await p.waitForSelector("[data-colorable='1']");
const piccoli = await p.evaluate(() => ({
  colori: document.querySelectorAll("button[aria-label^='Colore']").length,
  effetti: document.querySelectorAll("button[aria-label^='Effetto']").length,
  manoLibera: document.querySelectorAll("button[aria-label*='mano libera']").length,
}));
console.log("3 modalità 2-3 anni     :", JSON.stringify(piccoli), "(attesi 8 colori, 0 effetti, 0 mano libera)");
await p.screenshot({ path: `${OUT}/ui-eta-piccoli.png` });

// 4) cambio a 7+ dall'area genitori (in demo passo dal cookie via home)
await p.goto("http://localhost:3124/", { waitUntil: "networkidle" });
await p.evaluate(() => document.cookie = "colora_age=big; path=/");
await p.goto("http://localhost:3124/", { waitUntil: "networkidle" });
await p.locator("section", { hasText: "Disegni di esempio" }).locator("button:has(svg)").nth(1).click();
await p.waitForURL("**/color/**");
await p.waitForSelector("[data-colorable='1']");
const grandi = await p.evaluate(() => ({
  colori: document.querySelectorAll("button[aria-label^='Colore']").length,
  effetti: document.querySelectorAll("button[aria-label^='Effetto']").length,
  manoLibera: document.querySelectorAll("button[aria-label*='mano libera']").length,
}));
console.log("4 modalità 7+           :", JSON.stringify(grandi), "(attesi 16 colori, 1 effetti, 1 mano libera)");
await b.close();
