"use client";

import { useEffect, useRef } from "react";
import { PALETTE } from "./palette";

type Shape = "rect" | "circle" | "star" | "ribbon";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  wobble: number;
  color: string;
  shape: Shape;
}

const SHAPES: Shape[] = ["rect", "rect", "circle", "star", "ribbon"];

function star(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
}

// Festa su canvas: due cannoni di coriandoli dagli angoli in basso più
// una pioggia dall'alto, con stelline, cerchi e nastri che ondeggiano.
// `trigger` è un contatore: a ogni incremento parte una nuova festa.
export function Confetti({ trigger }: { trigger: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (trigger === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const pick = <T,>(list: readonly T[]) =>
      list[Math.floor(Math.random() * list.length)];

    const make = (x: number, y: number, vx: number, vy: number): Particle => ({
      x,
      y,
      vx,
      vy,
      size: 7 + Math.random() * 9,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * Math.PI * 2,
      color: pick(PALETTE),
      shape: pick(SHAPES),
    });

    const particles: Particle[] = [];
    // Cannoni dagli angoli in basso, verso il centro e in alto
    for (const side of [0, 1]) {
      for (let i = 0; i < 55; i++) {
        const angle = (side ? -1 : 1) * (0.35 + Math.random() * 0.5);
        const speed = 9 + Math.random() * 9;
        particles.push(
          make(
            side ? width + 10 : -10,
            height * 0.85,
            Math.sin(angle) * speed,
            -Math.cos(angle) * speed * 1.25
          )
        );
      }
    }
    // Pioggia dall'alto
    for (let i = 0; i < 60; i++) {
      particles.push(
        make(
          Math.random() * width,
          -20 - Math.random() * height * 0.6,
          (Math.random() - 0.5) * 2.5,
          2 + Math.random() * 3
        )
      );
    }

    let frame = 0;
    let raf = 0;
    const MAX_FRAMES = 300;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      let visible = false;
      const fade = Math.min(1, Math.max(0, (MAX_FRAMES - frame) / 80));
      for (const p of particles) {
        p.vx *= 0.985; // attrito dell'aria
        p.vy = p.vy * 0.985 + 0.22; // gravità
        p.wobble += 0.12;
        p.x += p.vx + Math.sin(p.wobble) * 0.8;
        p.y += p.vy;
        p.rotation += p.spin;
        if (p.y < height + 30) visible = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        switch (p.shape) {
          case "circle":
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2.6, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "star":
            star(ctx, p.size / 1.6);
            break;
          case "ribbon":
            // nastrino che "gira": si stringe e si allarga
            ctx.scale(1, Math.cos(p.wobble * 1.7));
            ctx.fillRect(-p.size, -p.size / 6, p.size * 2, p.size / 3);
            break;
          default:
            ctx.scale(Math.cos(p.wobble), 1);
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }
      frame += 1;
      if (visible && frame < MAX_FRAMES) {
        raf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }
    draw();

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
