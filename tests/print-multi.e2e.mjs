// Selezione multipla dalla home e stampa insieme: N disegni -> N pagine.
// Richiede l'app avviata: npm run build && npm run start -- -p 3132
import { chromium } from "playwright-core";
import fs from "fs";
const OUT = "/tmp/claude-0/-home-user-Draw/d6109a3d-4303-5f95-aa7c-4b659481af54/scratchpad";
const PORT = process.env.PORT || 3132;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 794, height: 1123 } });
p.on("pageerror", e => console.log("PAGEERROR:", String(e).slice(0,250)));

const pagine = (file) => {
  const bytes = fs.readFileSync(file, "latin1");
  return (bytes.match(/\/Type\s*\/Page[^s]/g) || []).length;
};

await p.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
// crea tre disegni dagli esempi
for (const nome of ["Un orsetto sorridente", "Un castello con un drago gentile", "Un razzo tra le stelle"]) {
  await p.getByRole("button", { name: new RegExp(nome) }).click();
  await p.waitForURL("**/color/**");
  await p.waitForSelector("[data-colorable='1']");
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
}

// selezione multipla
await p.getByRole("button", { name: /Stampa più disegni/ }).click();
await p.waitForTimeout(300);
await p.getByRole("button", { name: /^Tutti$/ }).click();
await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/ui-selezione.png`, fullPage: true });
const bottone = await p.getByRole("link", { name: /Stampa 3 disegni/ }).isVisible();
console.log("1 pulsante 'Stampa 3 disegni' :", bottone, "(atteso true)");

await p.getByRole("link", { name: /Stampa 3 disegni/ }).click();
await p.waitForURL("**/print/insieme**");
await p.waitForTimeout(1500);
const fogli = await p.locator(".print-sheet").count();
console.log("2 fogli nella pagina          :", fogli, "(attesi 3)");
const svgResi = await p.locator(".print-sheet svg").count();
console.log("3 disegni effettivamente resi :", svgResi, "(attesi 3)");

await p.pdf({ path: `${OUT}/tre-fogli.pdf`, format: "A4" });
console.log("4 pagine nel PDF              :", pagine(`${OUT}/tre-fogli.pdf`), "(attese 3)");
await p.emulateMedia({ media: "print" });
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/ui-tre-fogli.png`, fullPage: true });
await b.close();
