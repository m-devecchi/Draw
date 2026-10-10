// Il colore si allarga dal punto toccato come acquerello sulla carta,
// con un bordo morbido e irregolare, invece di comparire di colpo.
//
// Prima che il nuovo riempimento venga applicato si mette sopra all'area
// una sua copia con il colore VECCHIO; la copia ha una maschera con un
// buco circolare che cresce dal punto toccato, così il colore nuovo
// "sgorga" da lì fino a riempire tutta l'area. Funziona con qualunque
// riempimento (tinta piatta, sfumature, motivi) e anche con la gomma.

const NS = "http://www.w3.org/2000/svg";
let seq = 0;

/** Converte un punto dello schermo nelle coordinate locali dell'elemento. */
export function clientToLocal(
  el: SVGGraphicsElement,
  clientX: number,
  clientY: number
): { x: number; y: number } | null {
  const ctm = el.getScreenCTM();
  if (!ctm) return null;
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

/**
 * Da chiamare PRIMA di cambiare il fill di `target`.
 * `local` è il punto di partenza nelle coordinate dell'elemento; se manca
 * si parte dal centro dell'area.
 */
export function spreadFill(
  target: SVGGraphicsElement,
  local: { x: number; y: number } | null,
  duration = 440
) {
  const svg = target.ownerSVGElement;
  if (!svg || typeof window === "undefined") return;
  const reduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let box: DOMRect;
  try {
    box = target.getBBox();
  } catch {
    return;
  }
  if (!box.width || !box.height) return;

  const inside =
    local &&
    local.x >= box.x - 1 &&
    local.x <= box.x + box.width + 1 &&
    local.y >= box.y - 1 &&
    local.y <= box.y + box.height + 1;
  const cx = inside ? local!.x : box.x + box.width / 2;
  const cy = inside ? local!.y : box.y + box.height / 2;
  // Raggio che copre l'angolo più lontano dell'area
  const maxR = Math.max(
    Math.hypot(cx - box.x, cy - box.y),
    Math.hypot(cx - box.x - box.width, cy - box.y),
    Math.hypot(cx - box.x, cy - box.y - box.height),
    Math.hypot(cx - box.x - box.width, cy - box.y - box.height)
  );

  // Copia col colore vecchio, inerte e invisibile alle regole delle aree
  const clone = target.cloneNode(true) as SVGGraphicsElement;
  clone.removeAttribute("data-colorable");
  clone.removeAttribute("data-region");
  clone.removeAttribute("class");
  clone.setAttribute("pointer-events", "none");
  clone.setAttribute("aria-hidden", "true");

  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(NS, "defs");
    svg.insertBefore(defs, svg.firstChild);
  }
  const id = `spread-${++seq}`;
  const mask = document.createElementNS(NS, "mask");
  mask.setAttribute("id", id);
  mask.setAttribute("maskUnits", "userSpaceOnUse");
  const pad = Math.max(box.width, box.height);
  mask.setAttribute("x", String(box.x - pad));
  mask.setAttribute("y", String(box.y - pad));
  mask.setAttribute("width", String(box.width + pad * 2));
  mask.setAttribute("height", String(box.height + pad * 2));
  const rect = document.createElementNS(NS, "rect");
  rect.setAttribute("x", String(box.x - pad));
  rect.setAttribute("y", String(box.y - pad));
  rect.setAttribute("width", String(box.width + pad * 2));
  rect.setAttribute("height", String(box.height + pad * 2));
  rect.setAttribute("fill", "white");
  const hole = document.createElementNS(NS, "circle");
  hole.setAttribute("cx", String(cx));
  hole.setAttribute("cy", String(cy));
  hole.setAttribute("r", "0");
  hole.setAttribute("fill", "black");

  // Bordo d'acquerello: il cerchio viene "sbavato" (rumore) e sfumato
  const filter = document.createElementNS(NS, "filter");
  filter.setAttribute("id", `${id}-f`);
  filter.setAttribute("filterUnits", "userSpaceOnUse");
  for (const [k, v] of [
    ["x", box.x - pad],
    ["y", box.y - pad],
    ["width", box.width + pad * 2],
    ["height", box.height + pad * 2],
  ] as const)
    filter.setAttribute(k, String(v));
  const turb = document.createElementNS(NS, "feTurbulence");
  turb.setAttribute("type", "fractalNoise");
  turb.setAttribute("baseFrequency", String(3 / Math.max(maxR, 1)));
  turb.setAttribute("numOctaves", "2");
  turb.setAttribute("seed", String(seq % 50));
  turb.setAttribute("result", "n");
  const disp = document.createElementNS(NS, "feDisplacementMap");
  disp.setAttribute("in", "SourceGraphic");
  disp.setAttribute("in2", "n");
  disp.setAttribute("scale", String(maxR * 0.28));
  disp.setAttribute("result", "d");
  const blur = document.createElementNS(NS, "feGaussianBlur");
  blur.setAttribute("in", "d");
  blur.setAttribute("stdDeviation", String(maxR * 0.035));
  filter.append(turb, disp, blur);
  hole.setAttribute("filter", `url(#${id}-f)`);

  mask.append(rect, hole);
  defs.append(filter, mask);

  clone.setAttribute("mask", `url(#${id})`);
  target.after(clone);

  const cleanup = () => {
    clone.remove();
    mask.remove();
    filter.remove();
  };

  // Meno movimento: niente onda che si allarga, solo una dissolvenza breve
  if (reduced) {
    hole.setAttribute("r", String(maxR * 1.3));
    clone.removeAttribute("mask");
    const fade = clone.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 180,
      easing: "ease-out",
    });
    fade.onfinish = cleanup;
    fade.oncancel = cleanup;
    return;
  }

  const start = performance.now();
  // ease-out cubica: parte subito e si posa piano, senza finire di colpo
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const finalR = maxR * 1.3; // copre anche il bordo sfumato
  function frame(now: number) {
    const t = Math.min(1, Math.max(0, (now - start) / duration));
    hole.setAttribute("r", String(finalR * ease(t)));
    if (t < 1) requestAnimationFrame(frame);
    else cleanup();
  }
  requestAnimationFrame(frame);
}
