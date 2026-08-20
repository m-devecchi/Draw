"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export interface FloodFillHandle {
  undo(): void;
  reset(): void;
  exportPng(): Promise<string>;
}

const TOLERANCE = 48; // distanza massima dal colore di partenza
const MAX_UNDO = 20;

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

// Flood fill iterativo a scanline sul canvas.
function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  fillColor: [number, number, number]
) {
  const { width, height, data } = imageData;
  const start = (startY * width + startX) * 4;
  const [sr, sg, sb] = [data[start], data[start + 1], data[start + 2]];
  const [fr, fg, fb] = fillColor;
  if (sr === fr && sg === fg && sb === fb) return;

  // Non riempire partendo dalle linee nere.
  if (sr + sg + sb < 160) return;

  const matches = (i: number) =>
    Math.abs(data[i] - sr) <= TOLERANCE &&
    Math.abs(data[i + 1] - sg) <= TOLERANCE &&
    Math.abs(data[i + 2] - sb) <= TOLERANCE;

  const paint = (i: number) => {
    data[i] = fr;
    data[i + 1] = fg;
    data[i + 2] = fb;
    data[i + 3] = 255;
  };

  const stack: number[] = [startX, startY];
  const visited = new Uint8Array(width * height);

  while (stack.length) {
    const y = stack.pop()!;
    let x = stack.pop()!;
    let i = (y * width + x) * 4;

    // Torna al bordo sinistro dell'area.
    while (x > 0 && matches(i - 4) && !visited[y * width + x - 1]) {
      x -= 1;
      i -= 4;
    }

    let spanUp = false;
    let spanDown = false;
    while (x < width && matches(i) && !visited[y * width + x]) {
      paint(i);
      visited[y * width + x] = 1;

      if (y > 0) {
        const up = ((y - 1) * width + x) * 4;
        const canUp = matches(up) && !visited[(y - 1) * width + x];
        if (canUp && !spanUp) {
          stack.push(x, y - 1);
          spanUp = true;
        } else if (!canUp) {
          spanUp = false;
        }
      }
      if (y < height - 1) {
        const down = ((y + 1) * width + x) * 4;
        const canDown = matches(down) && !visited[(y + 1) * width + x];
        if (canDown && !spanDown) {
          stack.push(x, y + 1);
          spanDown = true;
        } else if (!canDown) {
          spanDown = false;
        }
      }
      x += 1;
      i += 4;
    }
  }
}

/**
 * Coloritura per immagini raster (provider futuri): flood fill al tocco.
 * `content` è un PNG in base64.
 */
export const FloodFillCanvas = forwardRef<
  FloodFillHandle,
  { content: string; color: string }
>(function FloodFillCanvas({ content, color }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const undoStack = useRef<ImageData[]>([]);
  const colorRef = useRef(color);
  colorRef.current = color;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
    };
    img.src = `data:image/png;base64,${content}`;
  }, [content]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function handleTap(e: PointerEvent) {
      const ctx = canvas!.getContext("2d")!;
      const rect = canvas!.getBoundingClientRect();
      const x = Math.floor(
        ((e.clientX - rect.left) / rect.width) * canvas!.width
      );
      const y = Math.floor(
        ((e.clientY - rect.top) / rect.height) * canvas!.height
      );
      if (x < 0 || y < 0 || x >= canvas!.width || y >= canvas!.height) return;

      const imageData = ctx.getImageData(0, 0, canvas!.width, canvas!.height);
      undoStack.current.push(
        ctx.getImageData(0, 0, canvas!.width, canvas!.height)
      );
      if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();

      floodFill(imageData, x, y, hexToRgb(colorRef.current));
      ctx.putImageData(imageData, 0, 0);
    }

    canvas.addEventListener("pointerdown", handleTap);
    return () => canvas.removeEventListener("pointerdown", handleTap);
  }, []);

  useImperativeHandle(ref, () => ({
    undo() {
      const canvas = canvasRef.current;
      const prev = undoStack.current.pop();
      if (canvas && prev) {
        canvas.getContext("2d")!.putImageData(prev, 0, 0);
      }
    },
    reset() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      undoStack.current = [];
      const img = new Image();
      img.onload = () => {
        canvas.getContext("2d")!.drawImage(img, 0, 0);
      };
      img.src = `data:image/png;base64,${content}`;
    },
    async exportPng() {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas non pronto");
      return canvas.toDataURL("image/png");
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className="w-full touch-manipulation rounded-3xl bg-white shadow-xl"
    />
  );
});
