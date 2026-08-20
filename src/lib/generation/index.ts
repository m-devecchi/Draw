import { ClaudeSvgProvider } from "./claude-svg";
import { MockProvider } from "./mock";
import { RasterProvider } from "./raster";
import type { GenerationProvider } from "./types";

export type { GenerationProvider, GenerationResult } from "./types";

// Selezione del provider via env: nuovi provider si registrano qui.
// Senza ANTHROPIC_API_KEY si ripiega sul provider mock (disegni
// preimpostati a caso), così l'app resta provabile end-to-end.
export function getGenerationProvider(): GenerationProvider {
  const fallback = process.env.ANTHROPIC_API_KEY ? "claude-svg" : "mock";
  const name = process.env.GENERATION_PROVIDER ?? fallback;
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
