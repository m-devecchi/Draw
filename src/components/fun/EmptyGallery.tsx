import { Emoji } from "@/components/ui/Emoji";

// Galleria vuota: invita a creare il primo disegno.
export function EmptyGallery({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border-[2.5px] border-dashed border-ink/30 bg-paper/70 px-6 py-10 text-center">
      <Emoji char="🖼️" size={64} decorative />
      <div className="text-ink-soft">
        {children ?? (
          <p className="font-bold">
            Qui finiranno i tuoi disegni. Creane uno qui sopra!
          </p>
        )}
      </div>
    </div>
  );
}
