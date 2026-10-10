// Quota giornaliera mostrata a pastelli invece che come "1/2 disegni":
// un bambino capisce a colpo d'occhio quanti disegni restano.
const CRAYON_COLORS = ["#ff5e5b", "#4cc9f0", "#2ec4a0", "#ffd23f", "#8b5cf6"];

function Crayon({ color, used }: { color: string; used: boolean }) {
  return (
    <svg
      viewBox="0 0 14 34"
      width="11"
      height="27"
      aria-hidden="true"
      className={used ? "opacity-30" : ""}
    >
      <path
        d="M3 12 7 2l4 10v19a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 3 31z"
        fill={used ? "#ffffff" : color}
        stroke="#1d1638"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M3 17h8M3 26h8" stroke="#1d1638" strokeWidth="1.5" />
    </svg>
  );
}

export function QuotaCrayons({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const remaining = Math.max(0, limit - used);
  const text =
    remaining > 0
      ? `${remaining} ${remaining === 1 ? "disegno" : "disegni"} oggi`
      : "finiti per oggi";

  // Con limiti alti (Premium) i pastelli diventerebbero una fila infinita.
  if (limit > 8) {
    return <span className="ink-chip">{text}</span>;
  }

  return (
    <span className="ink-chip gap-2 py-1 pl-2">
      <span
        className="flex items-end gap-0.5"
        role="img"
        aria-label={`${remaining} disegni rimasti su ${limit}`}
      >
        {Array.from({ length: limit }, (_, i) => (
          <Crayon
            key={i}
            color={CRAYON_COLORS[i % CRAYON_COLORS.length]}
            used={i >= remaining}
          />
        ))}
      </span>
      {text}
    </span>
  );
}
