import type { GenerationProvider, GenerationResult } from "./types";

/**
 * Punto di estensione per un provider di image generation raster
 * (es. Gemini Image, DALL·E, Stable Diffusion...).
 *
 * Contratto: restituire { kind: "raster", content: <PNG in base64> } con
 * un'immagine in stile "line art": contorni neri su sfondo bianco.
 * La UI di coloritura (FloodFillCanvas) applica già il flood fill al tocco,
 * quindi basta implementare generate() e impostare GENERATION_PROVIDER=raster.
 */
export class RasterProvider implements GenerationProvider {
  readonly name = "raster";

  async generate(_prompt: string): Promise<GenerationResult> {
    throw new Error(
      "Provider raster non ancora configurato: implementare src/lib/generation/raster.ts"
    );
  }
}
