import { Hanko } from "@/components/ui/Stamps";

// Logo: lettere a contorno sottile che si colorano una dopo l'altra, come
// la copertina di un album da colorare, poi il timbro hanko si posa accanto.
const LETTERS = [
  ["C", "#efb2ae"],
  ["o", "#f4d27c"],
  ["l", "#a6cb8c"],
  ["o", "#a5cae3"],
  ["r", "#bba8d8"],
  ["a", "#efa877"],
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
      className={`flex select-none items-center gap-1.5 font-logo font-black leading-none tracking-wide ${size}`}
    >
      <span aria-hidden="true" className="flex">
        {LETTERS.map(([ch, color], i) => (
          <span
            key={i}
            className="logo-letter"
            style={
              {
                "--c": color,
                animationDelay: `${120 + i * 90}ms`,
              } as React.CSSProperties
            }
          >
            {ch}
          </span>
        ))}
      </span>
      <Hanko className="hanko h-[0.95em] w-[0.95em]" />
    </Tag>
  );
}
