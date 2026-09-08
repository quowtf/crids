import Link from "next/link";

/** Barra de navegacion para las paginas autenticadas. */
export default function NavBar({ email }: { email?: string }) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <nav className="flex items-center gap-4 text-sm font-medium">
        <Link href="/train" className="hover:underline">
          Entrenar
        </Link>
        <Link href="/baseline" className="hover:underline">
          Línea base
        </Link>
        <Link href="/protocol" className="hover:underline">
          Protocolo
        </Link>
        <Link href="/mediciones" className="hover:underline">
          Mediciones
        </Link>
        <Link href="/history" className="hover:underline">
          Historial
        </Link>
      </nav>
      <div className="flex items-center gap-3 text-sm">
        {email && (
          <span className="hidden text-neutral-500 sm:inline">{email}</span>
        )}
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
