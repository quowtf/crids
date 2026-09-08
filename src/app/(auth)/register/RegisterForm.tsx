"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthState } from "../actions";

const initial: AuthState = {};

export default function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, initial);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Regístrate para empezar tu experimento de entrenamiento.
        </p>
      </div>

      {state.message ? (
        <div
          className="rounded-md border border-green-300 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
          role="status"
        >
          {state.message}
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Nombre de usuario (opcional)
            <input
              type="text"
              name="username"
              autoComplete="username"
              className="rounded-md border border-[var(--cell-border)] bg-[var(--cell-bg)] px-3 py-2 text-base outline-none focus:border-[var(--foreground)]"
            />
          </label>

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
              minLength={8}
              autoComplete="new-password"
              className="rounded-md border border-[var(--cell-border)] bg-[var(--cell-bg)] px-3 py-2 text-base outline-none focus:border-[var(--foreground)]"
            />
            <span className="text-xs text-neutral-500">Mínimo 8 caracteres.</span>
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
            {pending ? "Creando…" : "Crear cuenta"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-neutral-500">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="underline hover:text-[var(--foreground)]"
        >
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
