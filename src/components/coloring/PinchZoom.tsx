"use client";

import { Icon } from "@/components/ui/Icon";
import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
// Oltre questo movimento il gesto è una trascinata, non un tocco:
// il click che ne segue non deve colorare.
const TAP_TOLERANCE_PX = 10;

interface Point {
  x: number;
  y: number;
}

// Zoom a due dita + trascinamento, senza librerie.
// I tocchi "fermi" passano ai figli (colorano), le trascinate no.
export function PinchZoom({
  children,
  onZoomChange,
  panEnabled = true,
}: {
  children: React.ReactNode;
  onZoomChange?: (zoomed: boolean) => void;
  /** A mano libera il trascinamento va spento: il dito disegna. */
  panEnabled?: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });

  // Stato del gesto in corso (ref: non deve far ridisegnare a ogni frame).
  const pointers = useRef(new Map<number, Point>());
  const pinchStart = useRef<{
    distance: number;
    scale: number;
    center: Point;
    offset: Point;
  } | null>(null);
  const panStart = useRef<{ point: Point; offset: Point } | null>(null);
  const movedBy = useRef(0);
  const suppressClick = useRef(false);

  useEffect(() => {
    onZoomChange?.(scale > 1.01);
  }, [scale, onZoomChange]);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Limita lo spostamento perché il disegno non possa uscire di scena.
  const clampOffset = useCallback((next: Point, atScale: number): Point => {
    const el = wrapperRef.current;
    if (!el) return next;
    const maxX = (el.clientWidth * (atScale - 1)) / 2;
    const maxY = (el.clientHeight * (atScale - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  }, []);

  function handlePointerDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movedBy.current = 0;

    // Nuovo gesto da zero: si riparte "pulito". Senza questo, dopo una
    // pinzata (che non produce alcun click) il flag restava alzato e il
    // primo tocco successivo non colorava.
    if (pointers.current.size === 1) suppressClick.current = false;

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        scale,
        center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        offset,
      };
      panStart.current = null;
    } else if (pointers.current.size === 1 && scale > 1.01 && panEnabled) {
      panStart.current = { point: { x: e.clientX, y: e.clientY }, offset };
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const start = pinchStart.current;
      const nextScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, (start.scale * distance) / start.distance)
      );
      // Zoom centrato tra le due dita: il punto sotto le dita resta fermo.
      const el = wrapperRef.current;
      const rect = el?.getBoundingClientRect();
      if (rect) {
        const cx = start.center.x - rect.left - rect.width / 2;
        const cy = start.center.y - rect.top - rect.height / 2;
        const ratio = nextScale / start.scale;
        const next = {
          x: cx - (cx - start.offset.x) * ratio,
          y: cy - (cy - start.offset.y) * ratio,
        };
        setOffset(clampOffset(next, nextScale));
      }
      setScale(nextScale);
      movedBy.current += Math.abs(distance - start.distance);
      suppressClick.current = true;
      return;
    }

    if (pointers.current.size === 1 && panStart.current) {
      const dx = e.clientX - panStart.current.point.x;
      const dy = e.clientY - panStart.current.point.y;
      movedBy.current = Math.hypot(dx, dy);
      if (movedBy.current > TAP_TOLERANCE_PX) suppressClick.current = true;
      setOffset(
        clampOffset(
          {
            x: panStart.current.offset.x + dx,
            y: panStart.current.offset.y + dy,
          },
          scale
        )
      );
    }
  }

  function endPointer(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) panStart.current = null;
  }

  // Il click che segue una trascinata viene fermato prima di arrivare
  // al disegno (fase di cattura), così non colora per sbaglio.
  function handleClickCapture(e: React.MouseEvent) {
    if (suppressClick.current) {
      e.stopPropagation();
      e.preventDefault();
      suppressClick.current = false;
    }
  }

  const zoomed = scale > 1.01;

  return (
    <>
      <div
        ref={wrapperRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onClickCapture={handleClickCapture}
        onDoubleClick={reset}
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{ touchAction: "none" }}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center",
            transition: pointers.current.size ? "none" : "transform 120ms ease",
          }}
        >
          {children}
        </div>
      </div>

      {zoomed && (
        <button
          type="button"
          onClick={reset}
          aria-label="Torna alla vista intera"
          className="ink-icon-btn absolute bottom-32 right-4 z-20 !h-12 !w-12"
        >
          <Icon name="reset" />
        </button>
      )}
    </>
  );
}
