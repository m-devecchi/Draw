// Effetti di riempimento: tinta piatta, sfumatura e pois, con verifica
// che sopravvivano al ricaricamento (sono salvati nel disegno).
// Richiede l'app avviata: npm run build && npm run start -- -p 3121
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-Draw/d6109a3d-4303-5f95-aa7c-4b659481af54/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
p.on("pageerror", e => console.log("PAGEERROR:", String(e).slice(0,200)));

await p.goto("http://localhost:3121/", { waitUntil: "networkidle" });
await p.screenshot({ path: `${OUT}/ui-home-nuova.png`, fullPage: true });

await p.locator("section", { hasText: "Disegni di esempio" }).locator("button:has(svg)").first().click();
await p.waitForURL("**/color/**");
await p.waitForSelector("[data-colorable='1']");

const effectBtn = p.locator("button[aria-label^='Effetto']");
const swatches = p.locator("button[aria-label^='Colore']");
const regions = p.locator("[data-colorable='1']");

// 1) tinta piatta
await swatches.nth(4).click();
await regions.nth(2).dispatchEvent("click");
// 2) sfumatura
await effectBtn.click();
await swatches.nth(6).click();
await regions.nth(3).dispatchEvent("click");
// 3) pois
await effectBtn.click();
await swatches.nth(9).click();
await regions.nth(4).dispatchEvent("click");
await p.waitForTimeout(600);

const res = await p.evaluate(() => {
  const svg = document.querySelector(".coloring-svg svg");
  const fills = [...svg.querySelectorAll("[data-colorable='1']")].map(e => e.getAttribute("fill"));
  return {
    conUrl: fills.filter(f => f && f.startsWith("url(")).length,
    piatti: fills.filter(f => f && f.startsWith("#") && f.toLowerCase() !== "#ffffff").length,
    gradienti: svg.querySelectorAll("defs linearGradient").length,
    motivi: svg.querySelectorAll("defs pattern").length,
  };
});
console.log("aree con effetto (url):", res.conUrl, "(attese 2: sfumatura + pois)");
console.log("aree a tinta piatta   :", res.piatti, "(attesa 1)");
console.log("definizioni sfumatura :", res.gradienti, "(attesa 1)");
console.log("definizioni pois      :", res.motivi, "(attesa 1)");
await p.screenshot({ path: `${OUT}/ui-effetti.png` });

// l'effetto deve sopravvivere al ricaricamento (salvato nel disegno)
await p.reload({ waitUntil: "networkidle" });
await p.waitForSelector("[data-colorable='1']");
await p.waitForTimeout(600);
const dopoReload = await p.evaluate(() => {
  const svg = document.querySelector(".coloring-svg svg");
  return [...svg.querySelectorAll("[data-colorable='1']")]
    .filter(e => (e.getAttribute("fill")||"").startsWith("url(")).length;
});
console.log("aree con effetto dopo ricarica:", dopoReload, "(attese 2)");
await b.close();
