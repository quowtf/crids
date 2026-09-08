import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import ProtocolSession from "@/components/ProtocolSession";
import Link from "next/link";
import { protocolStep, PROTOCOL_STEPS } from "@/lib/protocol";
import { deriveProgress } from "@/lib/protocol-progress";
import { deriveBaseline } from "@/lib/baseline";
import type { GridResult } from "@/lib/types";

export default async function ProtocolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("grid_results")
    .select("*")
    .in("session_mode", ["protocol", "baseline"]);

  const all = (data ?? []) as GridResult[];
  const results = all.filter((r) => r.session_mode === "protocol");
  const progress = deriveProgress(results);
  const baseline = deriveBaseline(all);
  const step =
    progress.currentIndex != null ? protocolStep(progress.currentIndex) : null;

  const pct = Math.round((progress.completedCount / progress.total) * 100);

  return (
    <div className="min-h-dvh">
      <NavBar email={user?.email} />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-xl font-semibold">Protocolo</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Un plan de 40 ejercicios. Avanza a tu ritmo: cuenta lo que completas,
            no los días. Haz uno cuando puedas, o varios si te animas.
          </p>
        </div>

        {/* Sugerencia (no bloqueante) de hacer la línea base primero */}
        {!baseline.finished && (
          <div className="rounded-lg border border-[var(--cell-border)] bg-[var(--cell-bg-hover)] p-3 text-sm">
            Aún no completaste tu{" "}
            <Link href="/baseline" className="font-medium underline">
              línea base
            </Link>
            . Es recomendable hacerla antes de entrenar para poder comparar
            después, pero puedes empezar el protocolo cuando quieras.
          </div>
        )}

        {/* Barra de progreso */}
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">
              {progress.completedCount} / {progress.total} ejercicios
            </span>
            <span className="text-neutral-500">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--cell-bg-hover)]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: "var(--foreground)",
              }}
            />
          </div>
        </div>

        {/* Paso actual o final */}
        {progress.finished || !step ? (
          <div className="rounded-lg border border-[var(--cell-border)] p-6 text-center">
            <div className="text-lg font-semibold">
              Completaste el protocolo 🎉
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              Terminaste los {progress.total} ejercicios. Puedes seguir en modo
              libre desde Entrenar.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <ProtocolSession step={step} />
            </div>
          </>
        )}

        {/* Mapa del plan */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-500">
            Plan completo
          </h2>
          <ol className="flex flex-col gap-1">
            {PROTOCOL_STEPS.map((s) => {
              const done = progress.completed.has(s.index);
              const current = progress.currentIndex === s.index;
              return (
                <li
                  key={s.index}
                  className={[
                    "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
                    current
                      ? "border-[var(--foreground)] bg-[var(--cell-bg-hover)]"
                      : "border-[var(--cell-border)]",
                  ].join(" ")}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: done
                        ? "var(--ok-bg)"
                        : "var(--cell-bg-hover)",
                      color: done ? "var(--feedback-text)" : "var(--cell-text)",
                    }}
                  >
                    {done ? "✓" : s.index + 1}
                  </span>
                  <span className="text-neutral-500">
                    S{s.week}
                  </span>
                  <span className={current ? "font-medium" : ""}>
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      </main>
    </div>
  );
}
