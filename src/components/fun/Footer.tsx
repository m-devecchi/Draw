// Piede di pagina con il credito obbligatorio delle illustrazioni.
export function Footer() {
  return (
    <footer className="no-print mt-14 text-center text-xs font-semibold text-ink-soft/70">
      Illustrazioni{" "}
      <a
        href="https://openmoji.org"
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-dotted underline-offset-2"
      >
        OpenMoji
      </a>{" "}
      · licenza CC BY-SA 4.0
    </footer>
  );
}
