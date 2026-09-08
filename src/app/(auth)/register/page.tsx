import Link from "next/link";
import { isRegistrationEnabled } from "@/lib/settings";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  const enabled = await isRegistrationEnabled();

  if (!enabled) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-12 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Registro cerrado</h1>
          <p className="mt-2 text-sm text-neutral-500">
            El registro de nuevas cuentas no está disponible por el momento.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm underline hover:text-[var(--foreground)]"
        >
          Volver a iniciar sesión
        </Link>
      </main>
    );
  }

  return <RegisterForm />;
}
