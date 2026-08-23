import { SAMPLE_DRAWINGS } from "@/lib/samples";
import type {
  GenerationOptions,
  GenerationProvider,
  GenerationResult,
} from "./types";

// Provider di prova: ignora il prompt e restituisce a caso uno dei disegni
// preimpostati. Permette di collaudare l'intero flusso (login, quota,
// salvataggio, coloritura) senza consumare l'API di generazione.
// Attivo quando GENERATION_PROVIDER=mock, o come ripiego automatico se
// manca ANTHROPIC_API_KEY (vedi index.ts).
export class MockProvider implements GenerationProvider {
  readonly name = "mock";

  async generate(
    _prompt: string,
    _options?: GenerationOptions
  ): Promise<GenerationResult> {
    const sample =
      SAMPLE_DRAWINGS[Math.floor(Math.random() * SAMPLE_DRAWINGS.length)];
    return { kind: "svg", content: sample.content };
  }
}
