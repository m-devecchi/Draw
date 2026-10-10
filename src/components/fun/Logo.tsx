// Logo: le lettere di "Colora" nascono a contorno, come su un foglio da
// colorare, e si riempiono di colore una dopo l'altra.
const LETTERS = [
  ["C", "#ff5e5b", "-4deg"],
  ["o", "#ffd23f", "3deg"],
  ["l", "#2ec4a0", "-2deg"],
  ["o", "#4cc9f0", "4deg"],
  ["r", "#8b5cf6", "-3deg"],
  ["a", "#ff8fcf", "2deg"],
] as const;

export function Logo({
  size = "text-[2.1rem]",
  as: Tag = "h1",
}: {
  size?: string;
  as?: "h1" | "div";
}) {
  return (
    <Tag
      aria-label="Colora"
      className={`flex select-none font-logo leading-none tracking-wide ${size}`}
    >
      {LETTERS.map(([ch, color, rot], i) => (
        <span
          key={i}
          aria-hidden="true"
          className="logo-letter"
          style={
            {
              "--c": color,
              "--r": rot,
              animationDelay: `${150 + i * 110}ms`,
            } as React.CSSProperties
          }
        >
          {ch}
        </span>
      ))}
    </Tag>
  );
}
