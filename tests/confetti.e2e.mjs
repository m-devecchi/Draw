// Coriandoli: devono scendere a ogni completamento, anche dopo
// 🧼 Ricomincia (regressione segnalata).
// Richiede l'app avviata: npm run build && npm run start -- -p 3117
// Poi: node tests/confetti.e2e.mjs
import { chromium } from "playwright-core";
const PORT = process.env.PORT || 3117;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
p.on("pageerror", e => console.log("PAGEERROR:", String(e).slice(0,200)));

await p.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
await p.locator("section", { hasText: "Disegni di esempio" }).locator("button:has(svg)").first().click();
await p.waitForURL("**/color/**");
await p.waitForSelector("[data-colorable='1']");

const regions = await p.locator("[data-colorable='1']").count();
const swatches = p.locator("button[aria-label^='Colore']");

// pixel non trasparenti sul canvas dei coriandoli
const confettiPixels = () => p.evaluate(() => {
  const c = document.querySelector("canvas");
  if (!c) return -1;
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
  return n;
});

async function coloraTutto() {
  for (let i = 0; i < regions; i++) {
    await swatches.nth(i % 10).click();
    await p.locator("[data-colorable='1']").nth(i).dispatchEvent("click");
    await p.waitForTimeout(40);
  }
  await p.waitForTimeout(600);
}

await coloraTutto();
console.log("1a volta  - coriandoli:", await confettiPixels(), "(attesi > 0)");

// aspetta che l'animazione finisca e pulisca il canvas
await p.waitForTimeout(5000);
console.log("   dopo l'animazione   :", await confettiPixels(), "(attesi 0)");

// 🧼 Ricomincia
await p.getByRole("button", { name: "Ricomincia" }).click();
await p.waitForTimeout(500);
const dopoReset = await p.evaluate(() =>
  [...document.querySelectorAll("[data-colorable='1']")]
    .filter(e => (e.getAttribute("fill")||"").toLowerCase() !== "#ffffff").length);
console.log("dopo 🧼   - aree colorate:", dopoReset, "(attese 0)");

await coloraTutto();
console.log("2a volta  - coriandoli:", await confettiPixels(), "(attesi > 0)  <-- il caso segnalato");

await b.close();
