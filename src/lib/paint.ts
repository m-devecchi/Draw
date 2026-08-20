// Effetti di riempimento: oltre alla tinta piatta, sfumature e pois.
// Rendono i disegni più ricchi senza cambiare il modo di colorare.
//
// Il colore resta salvato come esadecimale (compatibile con i disegni
// già colorati); l'effetto è un suffisso facoltativo: "#ff5c5c:gradient".

export const EFFECTS = [
  "flat",
  "gradient",
  "dots",
  "stripes",
  "hearts",
  "stars",
  "checks",
  "bubbles",
  "confetti",
] as const;
export type Effect = (typeof EFFECTS)[number];

export const EFFECT_LABELS: Record<Effect, { icon: string; name: string }> = {
  flat: { icon: "🎨", name: "Tinta piatta" },
  gradient: { icon: "🌈", name: "Sfumatura" },
  dots: { icon: "✨", name: "Pois" },
  stripes: { icon: "🦓", name: "Righe" },
  hearts: { icon: "💗", name: "Cuori" },
  stars: { icon: "⭐", name: "Stelline" },
  checks: { icon: "🏁", name: "Quadretti" },
  bubbles: { icon: "🫧", name: "Bollicine" },
  confetti: { icon: "🎊", name: "Coriandoli" },
};


export function encodeFill(color: string, effect: Effect): string {
  return effect === "flat" ? color : `${color}:${effect}`;
}

export function decodeFill(value: string): { color: string; effect: Effect } {
  const [color, effect] = value.split(":");
  const known = EFFECTS.includes(effect as Effect) ? (effect as Effect) : "flat";
  return { color, effect: known };
}

// ── Schiarire / scurire un esadecimale ──────────────────────────────────

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function shade(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = clamp(((num >> 16) & 255) + 255 * amount);
  const g = clamp(((num >> 8) & 255) + 255 * amount);
  const b = clamp((num & 255) + 255 * amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Restituisce il valore da mettere nell'attributo `fill`, creando se
 * serve la definizione (sfumatura o motivo) dentro `<defs>` dell'SVG.
 * Idempotente: la stessa combinazione colore+effetto riusa la definizione.
 */
export function paintValue(
  svg: SVGSVGElement,
  color: string,
  effect: Effect
): string {
  if (effect === "flat") return color;

  const id = `${effect}-${color.replace("#", "")}`;
  if (svg.querySelector(`#${CSS.escape(id)}`)) return `url(#${id})`;

  const NS = "http://www.w3.org/2000/svg";
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(NS, "defs");
    svg.insertBefore(defs, svg.firstChild);
  }

  if (effect === "gradient") {
    const grad = document.createElementNS(NS, "linearGradient");
    grad.setAttribute("id", id);
    grad.setAttribute("x1", "0");
    grad.setAttribute("y1", "0");
    grad.setAttribute("x2", "0");
    grad.setAttribute("y2", "1");
    for (const [offset, stopColor] of [
      ["0%", shade(color, 0.22)],
      ["100%", shade(color, -0.16)],
    ]) {
      const stop = document.createElementNS(NS, "stop");
      stop.setAttribute("offset", offset);
      stop.setAttribute("stop-color", stopColor);
      grad.appendChild(stop);
    }
    defs.appendChild(grad);
  } else {
    defs.appendChild(buildPattern(NS, id, effect, color));
  }

  return `url(#${id})`;
}

/** Un motivo ripetuto: fondo del colore scelto + decori più scuri sopra. */
function buildPattern(
  NS: string,
  id: string,
  effect: Effect,
  color: string
): SVGPatternElement {
  const size = 26;
  const ink = shade(color, -0.2);
  const light = shade(color, 0.3);

  const pattern = document.createElementNS(NS, "pattern") as SVGPatternElement;
  pattern.setAttribute("id", id);
  pattern.setAttribute("width", String(size));
  pattern.setAttribute("height", String(size));
  pattern.setAttribute("patternUnits", "userSpaceOnUse");

  const base = document.createElementNS(NS, "rect");
  base.setAttribute("width", String(size));
  base.setAttribute("height", String(size));
  base.setAttribute("fill", color);
  pattern.appendChild(base);

  const add = (tag: string, attrs: Record<string, string>) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    pattern.appendChild(el);
  };

  switch (effect) {
    case "dots":
      add("circle", { cx: "7", cy: "7", r: "3.6", fill: ink });
      add("circle", { cx: "19", cy: "19", r: "3.6", fill: ink });
      break;

    case "stripes":
      pattern.setAttribute("patternTransform", "rotate(45)");
      add("rect", { width: String(size / 2), height: String(size), fill: ink });
      break;

    case "hearts": {
      // Cuore disegnato con due archi e una punta.
      const heart =
        "M 13 21 C 4 14 5 7 9 6 C 11.5 5.4 13 7.6 13 8.8 C 13 7.6 14.5 5.4 17 6 C 21 7 22 14 13 21 Z";
      add("path", { d: heart, fill: ink });
      break;
    }

    case "stars": {
      const star =
        "M 13 5 L 15.2 10.6 L 21 11 L 16.6 14.8 L 18 20.6 L 13 17.4 L 8 20.6 L 9.4 14.8 L 5 11 L 10.8 10.6 Z";
      add("path", { d: star, fill: ink });
      break;
    }

    case "checks":
      add("rect", {
        width: String(size / 2),
        height: String(size / 2),
        fill: ink,
      });
      add("rect", {
        x: String(size / 2),
        y: String(size / 2),
        width: String(size / 2),
        height: String(size / 2),
        fill: ink,
      });
      break;

    case "bubbles":
      add("circle", {
        cx: "8",
        cy: "8",
        r: "5",
        fill: "none",
        stroke: light,
        "stroke-width": "2",
      });
      add("circle", {
        cx: "19",
        cy: "18",
        r: "3",
        fill: "none",
        stroke: ink,
        "stroke-width": "2",
      });
      break;

    case "confetti":
      add("rect", {
        x: "4",
        y: "5",
        width: "7",
        height: "3",
        rx: "1.5",
        fill: ink,
        transform: "rotate(-25 7.5 6.5)",
      });
      add("rect", {
        x: "15",
        y: "16",
        width: "7",
        height: "3",
        rx: "1.5",
        fill: light,
        transform: "rotate(35 18.5 17.5)",
      });
      break;
  }

  return pattern;
}
