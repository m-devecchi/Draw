import { AutoColorDemo } from "@/components/fun/AutoColorDemo";
import { SAMPLE_DRAWINGS } from "@/lib/samples";

const DEMO = SAMPLE_DRAWINGS.find((s) => s.slug === "dino") ?? SAMPLE_DRAWINGS[0];

// Parola sottolineata da una pennellata morbida che si disegna.
export function Scribble({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <svg
        viewBox="0 0 200 24"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="brush-stroke absolute bottom-[0.02em] left-[-3%] h-[0.38em] w-[106%]"
      >
        <path
          d="M4 14 C 40 6, 70 19, 104 12 S 168 8, 196 12"
          fill="none"
          stroke="#efb2ae"
          strokeOpacity="0.75"
          strokeWidth="11"
          strokeLinecap="round"
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}

/**
 * Riquadro principale della home: domanda grande, un disegno che si
 * colora da solo (fa capire l'app senza spiegazioni) e il modulo.
 */
export function HomeHero({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="ink-card relative overflow-hidden p-5 sm:p-9">
      {/* Onde seigaiha che sfumano dall'angolo */}
      <div
        aria-hidden="true"
        className="seigaiha pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          maskImage:
            "radial-gradient(120% 90% at 100% 0%, black, transparent 60%)",
          WebkitMaskImage:
            "radial-gradient(120% 90% at 100% 0%, black, transparent 60%)",
        }}
      />
      <div className="relative flex items-start gap-4 sm:gap-8">
        <div className="min-w-0 flex-1">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">
            Nuovo disegno
          </p>
          <h2 className="font-display text-[2.2rem] font-semibold leading-[1.12] [text-wrap:balance] sm:text-[3.3rem]">
            {title}
          </h2>
          <p className="mt-4 hidden max-w-sm leading-relaxed text-ink-soft sm:block">
            Scrivi un soggetto: in pochi secondi diventa un foglio da colorare
            con un tocco.
          </p>
        </div>
        <div className="washi-tape relative w-[7.25rem] shrink-0 rotate-2 rounded-md border border-line bg-paper p-1.5 shadow-soft sm:w-60 sm:p-2.5">
          <AutoColorDemo
            content={DEMO.content}
            className="overflow-hidden rounded-sm"
          />
        </div>
      </div>
      <div className="relative mt-7">{children}</div>
    </section>
  );
}

// Titolo di sezione con sottotitolo facoltativo.
export function SectionTitle({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-[1.75rem] font-semibold leading-tight">
        {title}
      </h2>
      {hint && <p className="mt-0.5 text-ink-soft">{hint}</p>}
    </div>
  );
}
