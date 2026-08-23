import { samplesForAge } from "@/lib/samples";
import type {
  GenerationOptions,
  GenerationProvider,
  GenerationResult,
} from "./types";

// Provider di prova: ignora il prompt e restituisce a caso uno dei disegni
// preimpostati, scegliendo però tra quelli della complessità giusta per
// l'età — così si vede la differenza tra le tre versioni senza spendere
// un centesimo di API. Permette di collaudare l'intero flusso (login, quota,
// salvataggio, coloritura) senza consumare l'API di generazione.
// Attivo quando GENERATION_PROVIDER=mock, o come ripiego automatico se
// manca ANTHROPIC_API_KEY (vedi index.ts).
export class MockProvider implements GenerationProvider {
  readonly name = "mock";

  async generate(
    _prompt: string,
    options?: GenerationOptions
  ): Promise<GenerationResult> {
    const pool = samplesForAge(options?.ageBand);
    const sample = pool[Math.floor(Math.random() * pool.length)];
    return { kind: "svg", content: sample.content };
  }
}
