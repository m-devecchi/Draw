import { AutoColorDemo } from "@/components/fun/AutoColorDemo";
import { Icon } from "@/components/ui/Icon";
import { SAMPLE_DRAWINGS } from "@/lib/samples";

const DEMO = SAMPLE_DRAWINGS.find((s) => s.slug === "dino") ?? SAMPLE_DRAWINGS[0];

// Parola sottolineata con uno scarabocchio a pennarello che si disegna.
export function Scribble({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="relative z-10">{children}</span>
      <svg
        viewBox="0 0 200 24"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="marker-scribble absolute -bottom-1.5 left-[-4%] h-[0.42em] w-[108%]"
      >
        <path
          d="M4 15 C 40 4, 70 22, 104 12 S 168 6, 196 13"
          fill="none"
          stroke="#ff5e5b"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </svg>
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
    <section className="ink-card relative overflow-hidden bg-sun p-5 sm:p-8">
      {/* Puntini da carta da pacchi sul fondo giallo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(#1d1638 1.2px, transparent 1.4px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="relative flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <span className="ink-chip mb-3 bg-paper">
            <Icon name="sparkles" className="!h-4 !w-4" />
            Nuovo disegno
          </span>
          <h2 className="font-display text-[2.15rem] font-extrabold leading-[1.02] tracking-tight [text-wrap:balance] sm:text-5xl">
            {title}
          </h2>
          <p className="mt-3 hidden max-w-sm font-semibold text-ink/75 sm:block">
            Scrivi un soggetto: in pochi secondi diventa un foglio da colorare
            con un tocco.
          </p>
        </div>
        <div className="w-[7.5rem] shrink-0 rotate-3 rounded-2xl border-[2.5px] border-ink bg-paper p-1.5 shadow-[4px_4px_0_#1d1638] sm:w-60 sm:p-2.5">
          <AutoColorDemo
            content={DEMO.content}
            className="overflow-hidden rounded-xl"
          />
        </div>
      </div>
      <div className="relative mt-6">{children}</div>
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
      <h2 className="font-display text-[1.7rem] font-extrabold leading-tight tracking-tight">
        {title}
      </h2>
      {hint && <p className="font-semibold text-ink-soft">{hint}</p>}
    </div>
  );
}
