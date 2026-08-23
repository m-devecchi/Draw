// Risolutore per i test: Node, con lo stripping dei tipi, pretende
// l'estensione negli import relativi e non conosce l'alias "@/" del
// progetto. Qui si colmano entrambe le lacune, così i test possono
// importare i moduli così come sono scritti per Next.
import { pathToFileURL } from "node:url";
import path from "node:path";

const SRC = path.resolve(import.meta.dirname, "..", "src");

export async function resolve(specifier, context, next) {
  // Alias del progetto: "@/lib/x" → src/lib/x
  if (specifier.startsWith("@/")) {
    const base = path.join(SRC, specifier.slice(2));
    for (const candidato of [base, `${base}.ts`, `${base}.tsx`]) {
      try {
        return await next(pathToFileURL(candidato).href, context);
      } catch {
        // si prova il prossimo
      }
    }
  }

  try {
    return await next(specifier, context);
  } catch (err) {
    // Import relativo senza estensione
    if (specifier.startsWith(".") && !path.extname(specifier)) {
      for (const ext of [".ts", ".tsx"]) {
        try {
          return await next(specifier + ext, context);
        } catch {
          // si prova il prossimo
        }
      }
    }
    throw err;
  }
}
