// Il colore si allarga dal punto toccato invece di comparire di colpo.
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
  duration = 420
) {
  const svg = target.ownerSVGElement;
  if (!svg || typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

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
  mask.append(rect, hole);
  defs.appendChild(mask);

  clone.setAttribute("mask", `url(#${id})`);
  target.after(clone);

  const start = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  function frame(now: number) {
    const t = Math.min(1, Math.max(0, (now - start) / duration));
    hole.setAttribute("r", String(maxR * ease(t)));
    if (t < 1) requestAnimationFrame(frame);
    else {
      clone.remove();
      mask.remove();
    }
  }
  requestAnimationFrame(frame);
}
