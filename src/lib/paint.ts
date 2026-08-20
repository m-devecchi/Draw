// Effetti di riempimento: oltre alla tinta piatta, sfumature e pois.
// Rendono i disegni più ricchi senza cambiare il modo di colorare.
//
// Il colore resta salvato come esadecimale (compatibile con i disegni
// già colorati); l'effetto è un suffisso facoltativo: "#ff5c5c:gradient".

export const EFFECTS = ["flat", "gradient", "dots"] as const;
export type Effect = (typeof EFFECTS)[number];

export const EFFECT_LABELS: Record<Effect, { icon: string; name: string }> = {
  flat: { icon: "🎨", name: "Tinta piatta" },
  gradient: { icon: "🌈", name: "Sfumatura" },
  dots: { icon: "✨", name: "Pois" },
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
    // Pois: quadrato ripetuto con due cerchi più scuri.
    const pattern = document.createElementNS(NS, "pattern");
    pattern.setAttribute("id", id);
    pattern.setAttribute("width", "26");
    pattern.setAttribute("height", "26");
    pattern.setAttribute("patternUnits", "userSpaceOnUse");

    const base = document.createElementNS(NS, "rect");
    base.setAttribute("width", "26");
    base.setAttribute("height", "26");
    base.setAttribute("fill", color);
    pattern.appendChild(base);

    for (const [cx, cy] of [
      [7, 7],
      [19, 19],
    ]) {
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", String(cx));
      dot.setAttribute("cy", String(cy));
      dot.setAttribute("r", "3.6");
      dot.setAttribute("fill", shade(color, -0.2));
      pattern.appendChild(dot);
    }
    defs.appendChild(pattern);
  }

  return `url(#${id})`;
}
