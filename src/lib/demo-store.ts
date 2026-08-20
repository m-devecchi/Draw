// Persistenza locale per la modalità PoC (solo client): i disegni vivono
// nel localStorage del dispositivo. Nella modalità completa la stessa
// struttura è salvata su Postgres (tabella drawings).
export interface DemoDrawing {
  id: string;
  prompt: string;
  kind: "svg" | "raster";
  content: string;
  fills: Record<string, string>;
  createdAt: string;
}

const KEY = "colora-demo-drawings";
const MAX_DRAWINGS = 20; // localStorage è piccolo: teniamo gli ultimi 20

function readAll(): DemoDrawing[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeAll(drawings: DemoDrawing[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(drawings));
  } catch {
    // quota localStorage esaurita: rimuove i più vecchi e riprova
    try {
      window.localStorage.setItem(KEY, JSON.stringify(drawings.slice(0, 5)));
    } catch {
      // niente da fare: il disegno resta solo in memoria
    }
  }
}

export const demoStore = {
  list(): DemoDrawing[] {
    return readAll();
  },

  get(id: string): DemoDrawing | undefined {
    return readAll().find((d) => d.id === id);
  },

  add(drawing: Omit<DemoDrawing, "id" | "createdAt" | "fills">): DemoDrawing {
    const full: DemoDrawing = {
      ...drawing,
      id: `demo-${crypto.randomUUID()}`,
      fills: {},
      createdAt: new Date().toISOString(),
    };
    writeAll([full, ...readAll()].slice(0, MAX_DRAWINGS));
    return full;
  },

  saveFills(id: string, fills: Record<string, string>) {
    writeAll(readAll().map((d) => (d.id === id ? { ...d, fills } : d)));
  },

  remove(id: string) {
    writeAll(readAll().filter((d) => d.id !== id));
  },
};
