// Un disegno deve stare su UNA pagina A4 (i margini del contenitore lo
// spingevano su una seconda).
// Richiede l'app avviata: npm run build && npm run start -- -p 3130
import { chromium } from "playwright-core";
import fs from "fs";
const PORT = process.env.PORT || 3130;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 794, height: 1123 } });
await p.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
await p.getByRole("button", { name: /Un dinosauro felice/ }).click();
await p.waitForURL("**/color/**");
await p.waitForSelector("[data-colorable='1']");
await p.goto(p.url().replace("/color/", "/print/"), { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
const out = "/tmp/claude-0/-home-user-Draw/d6109a3d-4303-5f95-aa7c-4b659481af54/scratchpad/count.pdf";
await p.pdf({ path: out, format: "A4" });
const bytes = fs.readFileSync(out, "latin1");
const pages = (bytes.match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log("pagine nel PDF:", pages, "(attesa 1)");
await b.close();
