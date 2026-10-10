// Sfondo decorativo della home: macchie di colore sfocate e scarabocchi
// che galleggiano. Solo decorazione: niente eventi, fuori dalla stampa.

const BLOBS = [
  { color: "#ffce3e", size: 320, top: "-80px", left: "-90px", delay: "0s" },
  { color: "#ff8ad4", size: 260, top: "28%", right: "-110px", delay: "-6s" },
  { color: "#4ea7ff", size: 300, top: "62%", left: "-120px", delay: "-11s" },
  { color: "#58cc6d", size: 220, bottom: "-60px", right: "8%", delay: "-3s" },
];

const DOODLES: {
  kind: "star" | "cloud" | "spiral" | "heart" | "zigzag";
  color: string;
  size: number;
  top: string;
  left?: string;
  right?: string;
  rotate: number;
  delay: string;
}[] = [
  { kind: "star", color: "#ffce3e", size: 34, top: "9%", left: "5%", rotate: -12, delay: "0s" },
  { kind: "spiral", color: "#a06bff", size: 40, top: "16%", right: "6%", rotate: 10, delay: "-2s" },
  { kind: "cloud", color: "#4ea7ff", size: 56, top: "44%", left: "2%", rotate: 0, delay: "-4s" },
  { kind: "heart", color: "#ff5c5c", size: 28, top: "52%", right: "4%", rotate: 14, delay: "-1s" },
  { kind: "zigzag", color: "#58cc6d", size: 46, top: "76%", left: "7%", rotate: -8, delay: "-3s" },
  { kind: "star", color: "#ff9f43", size: 24, top: "84%", right: "10%", rotate: 20, delay: "-5s" },
  { kind: "star", color: "#4ecdc4", size: 18, top: "33%", left: "48%", rotate: 0, delay: "-2.5s" },
];

function Doodle({ kind, color }: { kind: string; color: string }) {
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: 3.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "star":
      return (
        <path
          {...common}
          fill={color}
          fillOpacity={0.35}
          d="M20 3l4.9 10.6 11.6 1.3-8.6 7.9 2.4 11.4L20 28.4 9.7 34.2l2.4-11.4-8.6-7.9 11.6-1.3z"
        />
      );
    case "cloud":
      return (
        <path
          {...common}
          fill="#fff"
          d="M10 30a7 7 0 0 1 1-14 10 10 0 0 1 18-3 8 8 0 0 1 6 17z"
        />
      );
    case "spiral":
      return (
        <path
          {...common}
          d="M20 20m0 0a2 2 0 1 1 3 2a5 5 0 1 1-7-5a9 9 0 1 1-2 13a13 13 0 1 1 18 1"
        />
      );
    case "heart":
      return (
        <path
          {...common}
          fill={color}
          fillOpacity={0.35}
          d="M20 34S5 25 5 14a7.5 7.5 0 0 1 15-2 7.5 7.5 0 0 1 15 2c0 11-15 20-15 20z"
        />
      );
    default:
      return <path {...common} d="M3 26l7-12 7 12 7-12 7 12 7-12" />;
  }
}

export function PlayfulBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="no-print pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {BLOBS.map(({ color, size, delay, ...pos }, i) => (
        <div
          key={i}
          className="blob"
          style={{
            ...pos,
            width: size,
            height: size,
            background: color,
            animationDelay: delay,
          }}
        />
      ))}
      {DOODLES.map((d, i) => (
        <svg
          key={i}
          viewBox="0 0 40 40"
          width={d.size}
          height={d.size}
          className="doodle opacity-70"
          style={
            {
              top: d.top,
              left: d.left,
              right: d.right,
              animationDelay: d.delay,
              "--r": `${d.rotate}deg`,
            } as React.CSSProperties
          }
        >
          <Doodle kind={d.kind} color={d.color} />
        </svg>
      ))}
    </div>
  );
}
