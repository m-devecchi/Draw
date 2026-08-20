import Anthropic from "@anthropic-ai/sdk";
import { sanitizeSvg } from "./sanitize-svg";
import type { GenerationProvider, GenerationResult } from "./types";

const SYSTEM_PROMPT = `Sei un illustratore di album da colorare per bambini dai 3 agli 8 anni.

Dato il soggetto richiesto, produci UN SOLO documento SVG con queste regole:

STILE
- Solo contorni: tratti neri (stroke="#000000"), spessore generoso (stroke-width 4-8), nessuna sfumatura, nessun colore.
- Ogni forma chiusa colorabile deve avere fill="#FFFFFF" (verrà riempita toccandola).
- Stile semplice, tondeggiante e amichevole, adatto ai bambini piccoli: pochi dettagli, aree ampie e ben separate, soggetto grande al centro.
- Aggiungi qualche elemento di contorno semplice (sole, nuvole, erba, stelle...) coerente col soggetto, anch'esso colorabile.
- Niente testo, niente scritte.

STRUTTURA TECNICA
- Root: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">.
- Usa solo elementi path, circle, ellipse, rect, polygon, line e gruppi <g>.
- Ogni area colorabile è un elemento chiuso indipendente con fill="#FFFFFF" e stroke nero: il bambino tocca l'area per riempirla, quindi le aree non devono sovrapporsi in modo ambiguo. Disegna prima le forme grandi, poi i dettagli sopra.
- Le linee puramente decorative (baffi, raggi...) hanno fill="none".
- Nessuno script, nessun link, nessuna immagine esterna, nessun testo.

RISPOSTA
Rispondi SOLO con il markup SVG, senza spiegazioni e senza recinzioni di codice.`;

export class ClaudeSvgProvider implements GenerationProvider {
  readonly name = "claude-svg";
  private client: Anthropic;
  private model: string;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY non configurata");
    }
    this.client = new Anthropic();
    this.model = process.env.GENERATION_MODEL ?? "claude-opus-5";
  }

  async generate(prompt: string): Promise<GenerationResult> {
    // Streaming: l'SVG può essere lungo e va oltre i timeout non-streaming.
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Disegno da colorare, soggetto: ${prompt}`,
        },
      ],
    });

    const response = await stream.finalMessage();

    if (response.stop_reason === "refusal") {
      throw new Error(
        "Il soggetto richiesto non è adatto: prova con un soggetto diverso."
      );
    }

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    return { kind: "svg", content: sanitizeSvg(text) };
  }
}
