// Verifica in browser dei gesti di coloritura:
// tocco = colora, trascinata = sposta (non colora), zoom a due dita.
// Richiede l'app avviata: npm run build && npm run start -- -p 3116
// Poi: node tests/coloring-interaction.e2e.mjs
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
p.on("pageerror", e => console.log("PAGEERROR:", String(e).slice(0,200)));
await p.goto("http://localhost:3116/", { waitUntil: "networkidle" });
await p.locator("section", { hasText: "Disegni di esempio" }).locator("button:has(svg)").first().click();
await p.waitForURL("**/color/**");
await p.waitForSelector("[data-colorable='1']");

const colored = () => p.evaluate(() =>
  [...document.querySelectorAll("[data-colorable='1']")]
    .filter(e => (e.getAttribute("fill") || "").toLowerCase() !== "#ffffff").length);

console.log("aree colorate all'inizio:", await colored());

// 1) tocco semplice deve colorare
await p.locator("button[aria-label^='Colore']").nth(4).click();
const box = await p.locator(".coloring-svg svg").boundingBox();
await p.mouse.click(box.x + box.width * 0.48, box.y + box.height * 0.62);
await p.waitForTimeout(300);
console.log("dopo un TOCCO semplice     :", await colored(), "(atteso 1)");

// 2) trascinata NON deve colorare
const n = await colored();
await p.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
await p.mouse.down();
await p.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5, { steps: 12 });
await p.mouse.up();
await p.waitForTimeout(300);
console.log("dopo una TRASCINATA        :", await colored(), `(atteso ${n}: invariato)`);

// 3) dopo lo zoom il tocco deve ancora colorare
await p.evaluate(() => {
  const w = document.querySelector('[style*="touch-action"]');
  const ev = (t, id, x, y) => w.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: x, clientY: y, bubbles: true, pointerType: "touch" }));
  ev("pointerdown", 1, 150, 400); ev("pointerdown", 2, 250, 400);
  ev("pointermove", 1, 100, 400); ev("pointermove", 2, 300, 400);
  ev("pointerup", 1, 100, 400); ev("pointerup", 2, 300, 400);
});
await p.waitForTimeout(400);
const n2 = await colored();
await p.locator("button[aria-label^='Colore']").nth(6).click();
// Con lo zoom il riquadro del disegno esce dallo schermo: si tocca al
// centro della finestra, che e' sempre sopra il disegno.
await p.mouse.click(195, 250);
await p.waitForTimeout(300);
console.log("dopo TOCCO con zoom attivo :", await colored(), `(atteso ${n2 + 1})`);
await b.close();
