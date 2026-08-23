import Anthropic from "@anthropic-ai/sdk";
import { sanitizeSvg } from "./sanitize-svg";
import type {
  GenerationOptions,
  GenerationProvider,
  GenerationResult,
} from "./types";

// La complessità del disegno è la cosa che conta di più su carta: per un
// bimbo di 2 anni servono poche aree enormi e linee spesse (colorabili
// senza uscire dai bordi), per uno di 8 una scena ricca di dettagli.
const COMPLEXITY: Record<string, string> = {
  small: `DIFFICOLTÀ: bambino di 2-3 anni.
- Da 5 a 9 aree colorabili IN TUTTO, ciascuna molto grande (almeno 150x150 unità).
- stroke-width tra 12 e 16: linee molto spesse, facili da seguire col pastello.
- Un solo soggetto enorme, che riempie quasi tutta la tavola, in posa frontale e simmetrica.
- Nessun dettaglio piccolo: niente dita, denti, piume, singoli capelli. Occhi e bocca grandi e semplici.
- Al massimo UN elemento di contorno (un sole, una nuvola), grande e staccato dal soggetto.`,

  medium: `DIFFICOLTÀ: bambino di 4-6 anni.
- Da 12 a 20 aree colorabili, di dimensione media, ben separate.
- stroke-width tra 7 e 10.
- Soggetto grande al centro, con qualche dettaglio riconoscibile (zampe, ali, ruote, finestre).
- Due o tre elementi di contorno semplici (sole, nuvole, erba, stelle).`,

  big: `DIFFICOLTÀ: bambino di 7 anni o più.
- Da 25 a 45 aree colorabili: una scena ricca, con primo piano e sfondo.
- stroke-width tra 4 e 6.
- Dettagli veri: motivi sui vestiti, mattoni, squame, foglie, finestre, sassi.
- Sfondo completo e coerente (paesaggio, cielo, terreno), anch'esso a zone colorabili.`,
};

const SYSTEM_PROMPT = `Sei un illustratore di album da colorare per bambini dai 2 agli 10 anni.

Dato il soggetto richiesto, produci UN SOLO documento SVG con queste regole:

STILE
- Solo contorni: tratti neri (stroke="#000000"), nessuna sfumatura, nessun colore. Lo spessore lo indica la DIFFICOLTÀ.
- Ogni forma chiusa colorabile deve avere fill="#FFFFFF" (verrà riempita toccandola).
- Stile tondeggiante e amichevole. Il numero di aree, lo spessore delle linee e la quantità di dettagli seguono la DIFFICOLTÀ indicata nel messaggio: rispettala, è la cosa più importante.
- Gli elementi di contorno (sole, nuvole, erba, stelle...) sono coerenti col soggetto e anch'essi colorabili.
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

  async generate(
    prompt: string,
    options?: GenerationOptions
  ): Promise<GenerationResult> {
    const complexity = COMPLEXITY[options?.ageBand ?? "medium"] ?? COMPLEXITY.medium;

    // Streaming: l'SVG può essere lungo e va oltre i timeout non-streaming.
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Disegno da colorare, soggetto: ${prompt}\n\n${complexity}`,
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
