"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export interface SplashHandle {
  /** Schizzo di colore nel punto (coordinate della finestra). */
  burst(x: number, y: number, color: string, sparkle?: boolean): void;
}

const STARS = ["✨", "⭐", "💫"];

/**
 * Schizzo di colore dove il dito ha toccato: un'onda e qualche goccia
 * che volano via. Elementi DOM creati e rimossi a mano, così ogni tocco
 * non fa ri-renderizzare la pagina.
 */
export const Splash = forwardRef<SplashHandle>(function Splash(_, ref) {
  const layer = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    burst(x, y, color, sparkle = false) {
      const root = layer.current;
      if (!root) return;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const pieces: HTMLElement[] = [];
      const add = (cls: string, style: Record<string, string>, text = "") => {
        const el = document.createElement("span");
        el.className = cls;
        el.textContent = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.color = color;
        for (const [k, v] of Object.entries(style)) el.style.setProperty(k, v);
        root.appendChild(el);
        pieces.push(el);
      };

      add("splash-ring", {});
      const drops = 9;
      for (let i = 0; i < drops; i++) {
        const angle = (i / drops) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 34 + Math.random() * 34;
        add("splash-dot", {
          "--dx": `${Math.cos(angle) * dist}px`,
          "--dy": `${Math.sin(angle) * dist}px`,
          "--s": `${6 + Math.random() * 8}px`,
        });
      }
      if (sparkle) {
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 40 + Math.random() * 30;
          add(
            "splash-star",
            {
              "--dx": `${Math.cos(angle) * dist}px`,
              "--dy": `${Math.sin(angle) * dist - 20}px`,
            },
            STARS[i % STARS.length]
          );
        }
      }
      setTimeout(() => pieces.forEach((p) => p.remove()), 900);
    },
  }));

  return (
    <div
      ref={layer}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[15] overflow-hidden"
    />
  );
});
