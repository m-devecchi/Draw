import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-6xl">🖍️</div>
      <h1 className="text-2xl font-extrabold">Ops, pagina non trovata!</h1>
      <Link
        href="/"
        className="rounded-full bg-crayon-purple px-6 py-3 font-extrabold text-white shadow-lg"
      >
        Torna ai disegni
      </Link>
    </main>
  );
}
