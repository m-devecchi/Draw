"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Stroke } from "@/lib/strokes";

/**
 * Strato trasparente per il disegno a mano libera, sovrapposto al disegno
 * da colorare. Condivide lo stesso viewBox, così i tratti restano al loro
 * posto a qualsiasi zoom e dimensione di schermo.
 */
export function FreehandLayer({
  viewBox,
  strokes,
  color,
  width,
  active,
  onStrokeEnd,
}: {
  viewBox: string;
  strokes: Stroke[];
  color: string;
  width: number;
  /** Quando è false lo strato lascia passare i tocchi (modalità riempi). */
  active: boolean;
  onStrokeEnd: (stroke: Stroke) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const drawing = useRef(false);

  // Da coordinate schermo a coordinate del viewBox. Si passa dal rettangolo
  // renderizzato, così vale anche con lo zoom applicato via CSS.
  const toViewBox = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const [minX, minY, vbWidth, vbHeight] = viewBox.split(/[\s,]+/).map(Number);
    return {
      x: minX + ((clientX - rect.left) / rect.width) * vbWidth,
      y: minY + ((clientY - rect.top) / rect.height) * vbHeight,
    };
  }, [viewBox]);

  useEffect(() => {
    if (!active) {
      drawing.current = false;
      setCurrent(null);
    }
  }, [active]);

  function handleDown(e: React.PointerEvent) {
    if (!active || e.isPrimary === false) return;
    const p = toViewBox(e.clientX, e.clientY);
    if (!p) return;
    drawing.current = true;
    svgRef.current?.setPointerCapture(e.pointerId);
    setCurrent(`M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }

  function handleMove(e: React.PointerEvent) {
    if (!drawing.current) return;
    const p = toViewBox(e.clientX, e.clientY);
    if (!p) return;
    setCurrent((d) => (d ? `${d} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : d));
  }

  function handleUp(e: React.PointerEvent) {
    if (!drawing.current) return;
    drawing.current = false;
    svgRef.current?.releasePointerCapture?.(e.pointerId);
    setCurrent((d) => {
      // Un tocco singolo diventa un punto, altrimenti sparirebbe.
      if (d && !d.includes("L")) {
        const [, x, y] = d.split(" ");
        onStrokeEnd({ d: `${d} L ${Number(x) + 0.6} ${y}`, c: color, w: width });
      } else if (d) {
        onStrokeEnd({ d, c: color, w: width });
      }
      return null;
    });
  }

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      className="absolute inset-0 h-full w-full"
      style={{
        pointerEvents: active ? "auto" : "none",
        touchAction: "none",
      }}
    >
      {strokes.map((s, i) => (
        <path
          key={i}
          d={s.d}
          stroke={s.c}
          strokeWidth={s.w}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {current && (
        <path
          d={current}
          stroke={color}
          strokeWidth={width}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
