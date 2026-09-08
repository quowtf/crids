import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import BaselineSession from "@/components/BaselineSession";
import SartSession from "@/components/SartSession";
import {
  BASELINE_STEPS,
  BASELINE_TESTS,
  baselineStep,
  baselineStepKey,
  deriveBaseline,
} from "@/lib/baseline";
import { formatDuration } from "@/lib/grid";
import type { GridResult, BaselineTest } from "@/lib/types";

/** Promedio de duración y errores por prueba (A/B/C). */
function averages(results: GridResult[]) {
  const byTest = new Map<
    BaselineTest,
    { durations: number[]; errors: number[] }
  >();
  for (const r of results) {
    if (r.session_mode !== "baseline" || !r.baseline_test) continue;
    const acc = byTest.get(r.baseline_test) ?? { durations: [], errors: [] };
    acc.durations.push(r.duration_ms);
    acc.errors.push(r.errors);
    byTest.set(r.baseline_test, acc);
  }
  return byTest;
}

export default async function BaselinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("grid_results")
    .select("*")
    .eq("session_mode", "baseline");

  // Prueba D (atención sostenida) vive en attention_tests.
  const { data: sartData } = await supabase
    .from("attention_tests")
    .select("*")
    .eq("session_mode", "baseline")
    .order("created_at", { ascending: false });

  const results = (data ?? []) as GridResult[];
  const sartResults = sartData ?? [];
  const progress = deriveBaseline(results);
  const step =
    progress.currentIndex != null ? baselineStep(progress.currentIndex) : null;
  const avgs = averages(results);

  const sartDone = sartResults.length > 0;
  const lastSart = sartResults[0];

  // Progreso total: 6 intentos de grid + 1 prueba D.
  const doneTotal = progress.doneCount + (sartDone ? 1 : 0);
  const grandTotal = progress.total + 1;
  const pct = Math.round((doneTotal / grandTotal) * 100);

  // La línea base está completa cuando A/B/C y D están hechas.
  const allDone = progress.finished && sartDone;
  // ¿Toca la prueba D? Cuando A/B/C terminaron pero D no.
  const showSart = progress.finished && !sartDone;

  return (
    <div className="min-h-dvh">
      <NavBar email={user?.email} />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-xl font-semibold">Línea base</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Tu punto de partida antes de entrenar. Pruebas A, B y C (dos intentos
            cada una) más la prueba D de atención sostenida. Idealmente hazlas
            descansado y a una hora similar.
          </p>
        </div>

        {/* Progreso */}
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">
              {doneTotal} / {grandTotal} pruebas
            </span>
            <span className="text-neutral-500">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--cell-bg-hover)]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: "var(--foreground)" }}
            />
          </div>
        </div>

        {allDone ? (
          <div className="rounded-lg border border-[var(--cell-border)] p-6 text-center">
            <div className="text-lg font-semibold">Línea base completa ✓</div>
            <p className="mt-2 text-sm text-neutral-500">
              Ya tienes tu punto de partida. Ahora puedes empezar el Protocolo.
            </p>
          </div>
        ) : showSart ? (
          <div className="flex justify-center">
            <SartSession />
          </div>
        ) : step ? (
          <div className="flex justify-center">
            <BaselineSession step={step} />
          </div>
        ) : null}

        {/* Resultados (promedios) */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-500">
            Promedios por prueba
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-500">
                <tr className="border-b border-[var(--cell-border)]">
                  <th className="py-2 pr-4 font-medium">Prueba</th>
                  <th className="py-2 pr-4 font-medium">Intentos</th>
                  <th className="py-2 pr-4 font-medium">Tiempo medio</th>
                  <th className="py-2 font-medium">Errores medios</th>
                </tr>
              </thead>
              <tbody>
                {BASELINE_TESTS.map((t) => {
                  const acc = avgs.get(t.test);
                  const n = acc?.durations.length ?? 0;
                  const avgDur =
                    n > 0
                      ? acc!.durations.reduce((a, b) => a + b, 0) / n
                      : null;
                  const avgErr =
                    n > 0 ? acc!.errors.reduce((a, b) => a + b, 0) / n : null;
                  return (
                    <tr
                      key={t.test}
                      className="border-b border-[var(--cell-border)]/50"
                    >
                      <td className="py-2 pr-4">{t.name}</td>
                      <td className="py-2 pr-4 font-mono tabular-nums">
                        {n}/2
                      </td>
                      <td className="py-2 pr-4 font-mono tabular-nums">
                        {avgDur == null ? "—" : formatDuration(Math.round(avgDur))}
                      </td>
                      <td className="py-2 font-mono tabular-nums">
                        {avgErr == null ? "—" : avgErr.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Resultado Prueba D */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-500">
            Prueba D — atención sostenida
          </h2>
          {!sartDone ? (
            <p className="text-sm text-neutral-500">
              Aún no realizada. Aparece al terminar A, B y C.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Omisiones" value={String(lastSart.omissions)} />
              <Stat label="Comisiones" value={String(lastSart.commissions)} />
              <Stat
                label="RT medio"
                value={
                  lastSart.mean_rt_ms == null
                    ? "—"
                    : `${lastSart.mean_rt_ms} ms`
                }
              />
              <Stat
                label="Variab. RT"
                value={
                  lastSart.rt_sd_ms == null ? "—" : `${lastSart.rt_sd_ms} ms`
                }
              />
            </div>
          )}
        </section>

        {/* Mapa de pasos */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-500">Pasos</h2>
          <ol className="flex flex-col gap-1">
            {BASELINE_STEPS.map((s) => {
              const done = progress.done.has(baselineStepKey(s.test, s.attempt));
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
                  <span className={current ? "font-medium" : ""}>
                    {s.def.name} · intento {s.attempt}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--cell-border)] p-3 text-center">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}
