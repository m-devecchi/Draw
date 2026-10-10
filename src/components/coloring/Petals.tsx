"use client";

import { useEffect, useRef } from "react";

interface Petal {
  x: number;
  y: number;
  vy: number;
  size: number;
  angle: number;
  spin: number;
  sway: number;
  swaySpeed: number;
  flip: number;
  color: string;
}

const COLORS = ["#f6c9c6", "#efb2ae", "#f9dcd9", "#e9a3a3", "#fbe7e4"];

/**
 * Petali di ciliegio che scendono ondeggiando quando il disegno è finito.
 * Dura poco (circa 4 secondi) e poi pulisce il canvas. Con "riduci
 * movimento" i petali compaiono e svaniscono senza cadere.
 * `trigger` è un contatore: a ogni incremento parte una nuova pioggia.
 */
export function Petals({ trigger }: { trigger: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (trigger === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const count = Math.round(Math.min(90, Math.max(50, width / 6)));
    const petals: Petal[] = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      // una parte è già in vista: la festa si vede subito
      y: i < count * 0.45 ? Math.random() * height * 0.55 : -20 - Math.random() * height * 0.5,
      vy: 1.1 + Math.random() * 1.6,
      size: 7 + Math.random() * 7,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.06,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.02 + Math.random() * 0.03,
      flip: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    // Petalo: due archi con la tacca in cima, come il fiore di sakura
    function drawPetal(p: Petal) {
      const s = p.size;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.angle);
      ctx!.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(p.flip)));
      ctx!.beginPath();
      ctx!.moveTo(0, s);
      ctx!.bezierCurveTo(-s * 1.1, s * 0.2, -s * 0.6, -s, -s * 0.12, -s * 0.8);
      ctx!.lineTo(0, -s * 0.55);
      ctx!.lineTo(s * 0.12, -s * 0.8);
      ctx!.bezierCurveTo(s * 0.6, -s, s * 1.1, s * 0.2, 0, s);
      ctx!.fillStyle = p.color;
      ctx!.fill();
      ctx!.strokeStyle = "rgba(200, 120, 120, 0.35)";
      ctx!.lineWidth = 0.8;
      ctx!.stroke();
      ctx!.restore();
    }

    let frame = 0;
    let raf = 0;
    const MAX_FRAMES = 230;

    function tick() {
      ctx!.clearRect(0, 0, width, height);
      // dissolvenza d'ingresso e d'uscita
      ctx!.globalAlpha = Math.min(1, frame / 12, (MAX_FRAMES - frame) / 50);
      for (const p of petals) {
        if (!reduced) {
          p.sway += p.swaySpeed;
          p.flip += 0.05;
          p.angle += p.spin;
          p.y += p.vy;
          p.x += Math.sin(p.sway) * 1.1 + 0.35;
        }
        drawPetal(p);
      }
      frame += 1;
      if (frame < MAX_FRAMES) raf = requestAnimationFrame(tick);
      else ctx!.clearRect(0, 0, width, height);
    }
    tick();
    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    />
  );
}
