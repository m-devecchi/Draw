// Illustrazioni OpenMoji (CC BY-SA 4.0, openmoji.org): contorno nero e
// colori pieni, lo stesso linguaggio dei disegni da colorare. I file sono
// in public/openmoji, nominati col codice Unicode. L'alt è l'emoji
// stessa, così lettori di schermo e nomi accessibili restano invariati.

function codeOf(emoji: string): string {
  return [...emoji]
    .map((c) => c.codePointAt(0)!)
    .filter((cp) => cp !== 0xfe0f)
    .map((cp) => cp.toString(16).toUpperCase())
    .join("-");
}

export function Emoji({
  char,
  size = 40,
  className = "",
  decorative = false,
}: {
  char: string;
  size?: number;
  className?: string;
  /** true quando accanto c'è già un testo che dice la stessa cosa. */
  decorative?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/openmoji/${codeOf(char)}.svg`}
      alt={decorative ? "" : char}
      width={size}
      height={size}
      draggable={false}
      className={`emoji-soft inline-block select-none ${className}`}
    />
  );
}
