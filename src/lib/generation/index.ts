import { ClaudeSvgProvider } from "./claude-svg";
import { MockProvider } from "./mock";
import { RasterProvider } from "./raster";
import type { GenerationProvider } from "./types";

export type { GenerationProvider, GenerationResult } from "./types";

// Selezione del provider via env: nuovi provider si registrano qui.
// Default: "mock" (qualsiasi prompt restituisce un disegno preimpostato a
// caso) — è la fase attuale del PoC. Per attivare la generazione vera con
// Claude impostare GENERATION_PROVIDER=claude-svg (serve ANTHROPIC_API_KEY).
export function getGenerationProvider(): GenerationProvider {
  const name = process.env.GENERATION_PROVIDER || "mock";
  switch (name) {
    case "claude-svg":
      return process.env.ANTHROPIC_API_KEY
        ? new ClaudeSvgProvider()
        : new MockProvider();
    case "mock":
      return new MockProvider();
    case "raster":
      return new RasterProvider();
    default:
      throw new Error(`GENERATION_PROVIDER sconosciuto: ${name}`);
  }
}
