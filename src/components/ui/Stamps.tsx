"use client";

import { useId } from "react";
import { GLYPHS } from "./japanese-glyphs";

const INK = "#c85a45";

// Bordi del timbro irregolari, come inchiostro vero su carta.
function InkFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" result="d" />
      <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="3" result="s" />
      <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.45" result="m" />
      <feComposite in="d" in2="m" operator="in" />
    </filter>
  );
}

function glyph(ch: string, cx: number, cy: number, size: number, fill: string) {
  // Il carattere occupa circa x 80–980, y 340–1220 nella sua casella
  const s = size / 1000;
  return (
    <path
      key={`${ch}${cx}`}
      d={GLYPHS[ch]}
      fill={fill}
      transform={`translate(${cx} ${cy}) scale(${s}) translate(-520 -780)`}
    />
  );
}

/** Sigillo hanko quadrato con il carattere 色 ("colore") in negativo. */
export function Hanko({ className = "" }: { className?: string }) {
  const f = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <defs>
        <InkFilter id={f} />
      </defs>
      <g filter={`url(#${f})`}>
        <rect x="6" y="6" width="88" height="88" rx="14" fill={INK} />
        <rect x="13" y="13" width="74" height="74" rx="9" fill="none" stroke="#fffdf9" strokeWidth="2.2" />
        {glyph("色", 50, 50, 62, "#fffdf9")}
      </g>
    </svg>
  );
}

/**
 * Il timbro "よくできました" ("ben fatto!") che le maestre giapponesi
 * mettono sui compiti: un fiore di ciliegio con la scritta dentro.
 */
export function WellDoneStamp({ className = "" }: { className?: string }) {
  const f = useId().replace(/:/g, "");
  // Cinque petali di sakura attorno al centro
  const petals = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * (Math.PI / 180);
    return { x: 100 + Math.cos(a) * 52, y: 100 + Math.sin(a) * 52, r: (i * 72) };
  });
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={className}>
      <defs>
        <InkFilter id={f} />
      </defs>
      <g filter={`url(#${f})`} fill="none" stroke={INK}>
        {petals.map((p, i) => (
          <ellipse
            key={i}
            cx={p.x}
            cy={p.y}
            rx="44"
            ry="40"
            strokeWidth="5"
            transform={`rotate(${p.r} ${p.x} ${p.y})`}
          />
        ))}
        <circle cx="100" cy="100" r="72" fill="#fffdf9" stroke="none" />
        <circle cx="100" cy="100" r="72" strokeWidth="5" />
        <circle cx="100" cy="100" r="64" strokeWidth="2" />
        {["よ", "く", "で", "き"].map((ch, i) =>
          glyph(ch, 49 + i * 34, 86, 34, INK)
        )}
        {["ま", "し", "た"].map((ch, i) => glyph(ch, 66 + i * 34, 124, 34, INK))}
      </g>
    </svg>
  );
}
