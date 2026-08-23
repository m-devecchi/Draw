// Stampa A4: foglio pulito in sole linee nere, opzione coi colori,
// comandi esclusi dalla carta e PDF A4 generato.
// Richiede l'app avviata: npm run build && npm run start -- -p 3126
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-Draw/d6109a3d-4303-5f95-aa7c-4b659481af54/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
p.on("pageerror", e => console.log("PAGEERROR:", String(e).slice(0,250)));

await p.goto("http://localhost:3126/", { waitUntil: "networkidle" });
// crea un disegno e coloralo un po'
await p.getByRole("button", { name: "🦕 dinosauro" }).click();
await p.getByRole("button", { name: "Crea!" }).click();
await p.waitForURL("**/color/**", { timeout: 60000 });
await p.waitForSelector("[data-colorable='1']");
for (let i = 0; i < 3; i++) {
  await p.locator("button[aria-label^='Colore']").nth(i).click();
  await p.locator("[data-colorable='1']").nth(i).dispatchEvent("click");
  await p.waitForTimeout(60);
}
await p.waitForTimeout(400);

// il pulsante stampa deve esserci
console.log("1 pulsante stampa nella coloritura:", await p.locator("a[aria-label*='Stampa']").count());
await p.locator("a[aria-label*='Stampa']").click();
await p.waitForURL("**/print/**");
await p.waitForTimeout(1000);

// di default: SOLO LINEE, quindi nessuna area colorata
const soloLinee = await p.evaluate(() =>
  [...document.querySelectorAll("[data-colorable='1']")]
    .filter(e => (e.getAttribute("fill")||"").toLowerCase() !== "#ffffff").length);
console.log("2 aree colorate (solo linee) :", soloLinee, "(attese 0)");
await p.screenshot({ path: `${OUT}/ui-stampa.png`, fullPage: true });

// con i colori
await p.getByRole("button", { name: /Solo linee/ }).click();
await p.waitForTimeout(600);
const conColori = await p.evaluate(() =>
  [...document.querySelectorAll("[data-colorable='1']")]
    .filter(e => (e.getAttribute("fill")||"").toLowerCase() !== "#ffffff").length);
console.log("3 aree colorate (con colori) :", conColori, "(attese 3)");

// resa in stampa: i comandi non devono finire sulla carta
await p.emulateMedia({ media: "print" });
await p.waitForTimeout(300);
const comandiInStampa = await p.evaluate(() => {
  const el = document.querySelector(".no-print");
  return el ? getComputedStyle(el).display : "assente";
});
console.log("4 comandi in stampa          :", comandiInStampa, "(atteso none)");
const pdf = `${OUT}/foglio-a4.pdf`;
await p.pdf({ path: pdf, format: "A4", printBackground: false });
console.log("5 PDF A4 generato            :", pdf);
await b.close();
