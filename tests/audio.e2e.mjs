// Audio: misura il segnale che esce davvero dal grafo Web Audio
// (un oscillatore avviato non garantisce suono udibile).
// Richiede l'app avviata: npm run build && npm run start -- -p 3118
// Poi: node tests/audio.e2e.mjs
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });

// Innesta un analizzatore su ogni GainNode creato dal codice reale:
// misuriamo il segnale che esce davvero, non solo "e' partito un oscillatore".
await p.addInitScript(() => {
  window.__peak = 0;
  const Orig = window.AudioContext || window.webkitAudioContext;
  window.AudioContext = class extends Orig {
    createGain() {
      const gain = super.createGain();
      const analyser = super.createAnalyser();
      analyser.fftSize = 2048;
      gain.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      const sample = () => {
        analyser.getFloatTimeDomainData(buf);
        for (const v of buf) window.__peak = Math.max(window.__peak, Math.abs(v));
      };
      const id = setInterval(sample, 20);
      setTimeout(() => clearInterval(id), 3000);
      return gain;
    }
  };
});

await p.goto("http://localhost:3118/", { waitUntil: "networkidle" });
await p.locator("section", { hasText: "Disegni di esempio" }).locator("button:has(svg)").first().click();
await p.waitForURL("**/color/**");
await p.waitForSelector("[data-colorable='1']");

const box = await p.locator(".coloring-svg svg").boundingBox();
await p.mouse.click(box.x + box.width * 0.48, box.y + box.height * 0.62);
await p.waitForTimeout(1200);
const peakFill = await p.evaluate(() => window.__peak);
console.log("ampiezza massima dopo un tocco :", peakFill.toFixed(4), peakFill > 0.01 ? "→ SUONO UDIBILE" : "→ silenzio");

// Silenzia e verifica che davvero non esca nulla
await p.evaluate(() => { window.__peak = 0; });
await p.getByRole("button", { name: /Silenzia/i }).click();
await p.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.75);
await p.waitForTimeout(800);
const peakMuted = await p.evaluate(() => window.__peak);
console.log("ampiezza con audio silenziato   :", peakMuted.toFixed(4), peakMuted < 0.01 ? "→ silenzio (giusto)" : "→ suona ancora!");
await b.close();
