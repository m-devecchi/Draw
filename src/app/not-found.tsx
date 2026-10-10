import { Emoji } from "@/components/ui/Emoji";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <Emoji char="🖍️" size={96} decorative />
      <h1 className="font-display text-2xl font-extrabold">Ops, pagina non trovata!</h1>
      <Link
        href="/"
        className="ink-btn ink-btn-primary px-6 py-3 text-lg"
      >
        Torna ai disegni
      </Link>
    </main>
  );
}
