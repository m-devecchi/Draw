// Quota giornaliera mostrata a matite invece che come "1/2 disegni":
// un bambino capisce a colpo d'occhio quanti disegni restano.
export function QuotaCrayons({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  // Con limiti alti (Premium) le matite diventerebbero una fila infinita.
  if (limit > 8) {
    return (
      <span className="text-sm font-bold text-stone-500">
        {Math.max(0, limit - used)} disegni ancora oggi
      </span>
    );
  }

  const remaining = Math.max(0, limit - used);
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="flex gap-0.5 text-xl"
        role="img"
        aria-label={`${remaining} disegni rimasti su ${limit}`}
      >
        {Array.from({ length: limit }, (_, i) => (
          <span key={i} className={i < remaining ? "" : "opacity-25 grayscale"}>
            🖍️
          </span>
        ))}
      </span>
      <span className="text-sm font-bold text-stone-500">
        {remaining > 0
          ? `${remaining} ${remaining === 1 ? "disegno" : "disegni"} oggi`
          : "finiti per oggi"}
      </span>
    </span>
  );
}
