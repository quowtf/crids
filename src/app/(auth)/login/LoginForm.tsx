"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, type AuthState } from "../actions";

const initial: AuthState = {};

export default function LoginForm({
  showRegister,
}: {
  showRegister: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(signIn, initial);

  useEffect(() => {
    if (state.message === "ok") {
      router.replace("/train");
      router.refresh();
    }
  }, [state.message, router]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Entra para registrar tu entrenamiento.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Correo
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-md border border-[var(--cell-border)] bg-[var(--cell-bg)] px-3 py-2 text-base outline-none focus:border-[var(--foreground)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-[var(--cell-border)] bg-[var(--cell-bg)] px-3 py-2 text-base outline-none focus:border-[var(--foreground)]"
          />
        </label>

        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--foreground)] px-4 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-85 disabled:opacity-50"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>

      {showRegister && (
        <p className="text-center text-sm text-neutral-500">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="underline hover:text-[var(--foreground)]"
          >
            Regístrate
          </Link>
        </p>
      )}
    </main>
  );
}
