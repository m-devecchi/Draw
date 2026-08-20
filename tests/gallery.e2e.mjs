// Galleria: le card mostrano l'anteprima reale del disegno coi colori
// applicati (stesse regole della coloritura, modulo svg-regions).
// Richiede l'app avviata: npm run build && npm run start -- -p 3120
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-Draw/d6109a3d-4303-5f95-aa7c-4b659481af54/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
p.on("pageerror", e => console.log("PAGEERROR:", String(e).slice(0,200)));

await p.goto("http://localhost:3120/", { waitUntil: "networkidle" });

// crea due disegni colorandone uno
for (const i of [0, 1]) {
  await p.locator("section", { hasText: "Disegni di esempio" }).locator("button:has(svg)").nth(i).click();
  await p.waitForURL("**/color/**");
  await p.waitForSelector("[data-colorable='1']");
  if (i === 0) {
    const n = Math.min(5, await p.locator("[data-colorable='1']").count());
    for (let k = 0; k < n; k++) {
      await p.locator("button[aria-label^='Colore']").nth(k).click();
      await p.locator("[data-colorable='1']").nth(k).dispatchEvent("click");
      await p.waitForTimeout(50);
    }
  }
  await p.waitForTimeout(400);
  await p.getByRole("link", { name: /Torna ai disegni/i }).click();
  await p.waitForURL(url => !url.pathname.startsWith("/color"));
  await p.waitForTimeout(500);
}

// quante anteprime SVG ci sono nella sezione "I tuoi disegni"?
const info = await p.evaluate(() => {
  const secs = [...document.querySelectorAll("section")];
  const mine = secs.find(s => s.textContent.includes("I tuoi disegni"));
  const svgs = mine ? mine.querySelectorAll("li svg").length : -1;
  const colored = mine ? [...mine.querySelectorAll("li svg [data-colorable='1']")]
    .filter(e => (e.getAttribute("fill")||"").toLowerCase() !== "#ffffff").length : -1;
  return { anteprime: svgs, areeColorateVisibili: colored };
});
console.log("anteprime nella galleria :", info.anteprime, "(attese 2)");
console.log("aree colorate visibili   :", info.areeColorateVisibili, "(attese > 0: i colori si vedono)");
await p.screenshot({ path: `${OUT}/ui-galleria.png`, fullPage: true });
await b.close();
