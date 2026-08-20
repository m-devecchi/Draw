// Nove effetti di riempimento, mano libera e Annulla sui tratti.
// Richiede l'app avviata: npm run build && npm run start -- -p 3123
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-Draw/d6109a3d-4303-5f95-aa7c-4b659481af54/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
p.on("pageerror", e => console.log("PAGEERROR:", String(e).slice(0,250)));

await p.goto("http://localhost:3123/", { waitUntil: "networkidle" });
await p.locator("section", { hasText: "Disegni di esempio" }).locator("button:has(svg)").first().click();
await p.waitForURL("**/color/**");
await p.waitForSelector("[data-colorable='1']");

// --- effetti: il cassetto deve mostrarne 9 ---
await p.locator("button[aria-label^='Effetto']").click();
await p.waitForTimeout(300);
const nEffetti = await p.locator("div[aria-label], button[aria-pressed]").count();
const effettiTray = await p.evaluate(() => {
  const names = ["Tinta piatta","Sfumatura","Pois","Righe","Cuori","Stelline","Quadretti","Bollicine","Coriandoli"];
  return names.filter(n => document.querySelector(`button[aria-label="${n}"]`)).length;
});
console.log("effetti nel cassetto :", effettiTray, "(attesi 9)");
await p.screenshot({ path: `${OUT}/ui-effetti-cassetto.png` });

// applica quattro effetti diversi
const regions = p.locator("[data-colorable='1']");
const swatches = p.locator("button[aria-label^='Colore']");
for (const [i, nome] of [[2,"Righe"],[3,"Cuori"],[4,"Stelline"],[5,"Bollicine"]]) {
  const voce = p.locator(`button[aria-label="${nome}"]`);
  // Il cassetto si chiude dopo ogni scelta: lo si riapre solo se serve.
  if (!(await voce.isVisible().catch(() => false))) {
    await p.locator("button[aria-label^='Effetto']").click();
    await p.waitForTimeout(200);
  }
  await voce.click();
  await swatches.nth(i % 8).click();
  await regions.nth(i).dispatchEvent("click");
  await p.waitForTimeout(120);
}
const motivi = await p.evaluate(() => document.querySelectorAll(".coloring-svg svg defs pattern").length);
console.log("motivi creati        :", motivi, "(attesi 4)");

// --- mano libera ---
console.log("pulsante mano libera :", await p.locator("button[aria-label*='mano libera']").count());
await p.locator("button[aria-label*='mano libera']").click();
await p.waitForTimeout(300);
const box = await p.locator(".coloring-svg svg").boundingBox();
await p.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
await p.mouse.down();
for (let i = 1; i <= 10; i++) {
  await p.mouse.move(box.x + box.width * (0.3 + i * 0.03), box.y + box.height * (0.3 + Math.sin(i) * 0.04));
  await p.waitForTimeout(20);
}
await p.mouse.up();
await p.waitForTimeout(600);
const tratti = await p.evaluate(() => {
  const layers = [...document.querySelectorAll("svg")];
  const overlay = layers.find(s => s.style.touchAction === "none");
  return overlay ? overlay.querySelectorAll("path").length : -1;
});
console.log("tratti disegnati     :", tratti, "(atteso >= 1)");
await p.screenshot({ path: `${OUT}/ui-mano-libera.png` });

// Annulla deve togliere il tratto
await p.getByRole("button", { name: "Annulla" }).click();
await p.waitForTimeout(400);
const dopoUndo = await p.evaluate(() => {
  const overlay = [...document.querySelectorAll("svg")].find(s => s.style.touchAction === "none");
  return overlay ? overlay.querySelectorAll("path").length : -1;
});
console.log("tratti dopo Annulla  :", dopoUndo, "(atteso 0)");
await b.close();
