// Astrazione dei provider di generazione: consente di affiancare in futuro
// un servizio di image generation raster senza toccare il resto dell'app.

export type GenerationResult =
  | { kind: "svg"; content: string } // markup SVG sanificato
  | { kind: "raster"; content: string }; // PNG in base64 (data URL escluso)

export interface GenerationProvider {
  /** Identificatore registrato nell'evento di generazione (audit/quote). */
  readonly name: string;
  /** Genera un disegno da colorare (solo linee nere) dal prompt. */
  generate(prompt: string): Promise<GenerationResult>;
}
