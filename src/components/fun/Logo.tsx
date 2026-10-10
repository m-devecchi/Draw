// Logo "Colora" con ogni lettera di un colore a matitone diverso:
// le lettere saltellano a turno, come se qualcuno le stesse colorando.
const LETTERS = [
  ["C", "#ff5c5c"],
  ["o", "#ff9f43"],
  ["l", "#f5b700"],
  ["o", "#58cc6d"],
  ["r", "#4ea7ff"],
  ["a", "#a06bff"],
] as const;

export function Logo({ className = "" }: { className?: string }) {
  return (
    <h1
      aria-label="Colora"
      className={`flex items-center gap-1.5 font-display text-4xl font-bold tracking-tight ${className}`}
    >
      <span aria-hidden="true" className="logo-letter mr-1 text-3xl" style={{ animationDelay: "-0.4s" }}>
        🖍️
      </span>
      <span aria-hidden="true" className="flex">
        {LETTERS.map(([ch, color], i) => (
          <span
            key={i}
            className="logo-letter"
            style={{ color, animationDelay: `${i * 0.12}s` }}
          >
            {ch}
          </span>
        ))}
      </span>
    </h1>
  );
}
