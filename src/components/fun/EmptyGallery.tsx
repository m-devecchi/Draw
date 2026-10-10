// Galleria vuota: un cavalletto che invita a creare il primo disegno.
export function EmptyGallery({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border-4 border-dashed border-crayon-purple/25 bg-white/60 p-8 text-center text-stone-500">
      <div className="crayon-bounce mb-2 text-5xl">🎨</div>
      {children ?? (
        <p className="font-bold">Ancora nessun disegno: creane uno qui sopra!</p>
      )}
    </div>
  );
}
