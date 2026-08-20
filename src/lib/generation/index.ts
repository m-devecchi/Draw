import { ClaudeSvgProvider } from "./claude-svg";
import { RasterProvider } from "./raster";
import type { GenerationProvider } from "./types";

export type { GenerationProvider, GenerationResult } from "./types";

// Selezione del provider via env: nuovi provider si registrano qui.
export function getGenerationProvider(): GenerationProvider {
  const name = process.env.GENERATION_PROVIDER ?? "claude-svg";
  switch (name) {
    case "claude-svg":
      return new ClaudeSvgProvider();
    case "raster":
      return new RasterProvider();
    default:
      throw new Error(`GENERATION_PROVIDER sconosciuto: ${name}`);
  }
}
