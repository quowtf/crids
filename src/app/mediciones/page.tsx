import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import MeasurementSession from "@/components/MeasurementSession";
import { deriveProgress } from "@/lib/protocol-progress";
import { deriveMeasurements, MEASUREMENT_GRID_TESTS } from "@/lib/measurements";
import TransferPanel from "@/components/TransferPanel";
import type { SartRow } from "@/lib/transfer";
import type { GridResult, BaselineTest } from "@/lib/types";

export default async function MeasurementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Resultados de grid: protocolo (progreso), transfer y baseline (para la gráfica).
  const { data: gridData } = await supabase
    .from("grid_results")
    .select("*")
    .in("session_mode", ["protocol", "transfer", "baseline"])
    .order("created_at", { ascending: false });

  const grids = (gridData ?? []) as GridResult[];
  const protocolGrids = grids.filter((r) => r.session_mode === "protocol");
  const transferGrids = grids.filter((r) => r.session_mode === "transfer");
  // Grids que entran en la gráfica de transferencia: baseline (M0) + transfer.
  const transferChartGrids = grids.filter(
    (r) => r.session_mode === "baseline" || r.session_mode === "transfer",
  );

  const progress = deriveProgress(protocolGrids);
  const lastProtocolAt =
    protocolGrids.length > 0 ? new Date(protocolGrids[0].created_at) : null;

  // SART: baseline (M0) + transfer, para desbloqueo y para la gráfica.
  const { data: sartData } = await supabase
    .from("attention_tests")
    .select("session_mode,measurement_index,omissions,commissions,mean_rt_ms")
    .in("session_mode", ["baseline", "transfer"]);

  const sartRows = sartData ?? [];
  const sartByMeasurement = new Set<number>();
  for (const s of sartRows) {
    if (s.session_mode === "transfer" && s.measurement_index != null)
      sartByMeasurement.add(s.measurement_index);
  }

  const states = deriveMeasurements({
    protocolSteps: progress.completedCount,
    transferGrids,
    sartByMeasurement,
    lastProtocolAt,
    now: new Date(),
  });

  // Primera medición disponible sin terminar -> se puede hacer ahora.
  const active = states.find((s) => s.status === "available");

  // Para la sesión activa: qué partes A/B/C ya hechas y si D está hecha.
  const activeGridDone: BaselineTest[] = active
    ? MEASUREMENT_GRID_TESTS.filter((t) =>
        transferGrids.some(
          (r) =>
            r.measurement_index === active.def.index &&
            r.baseline_test === t.test,
        ),
      ).map((t) => t.test)
    : [];
  const activeSartDone = active
    ? sartByMeasurement.has(active.def.index)
    : false;

  return (
    <div className="min-h-dvh">
      <NavBar email={user?.email} />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-xl font-semibold">Mediciones</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Repites la batería (A, B, C y D) en distintos momentos del
            entrenamiento para ver si mejoras en tareas que no entrenaste. Se
            desbloquean según tu avance en el protocolo.
          </p>
        </div>

        {/* Medición activa */}
        {active ? (
          <section className="flex flex-col items-center gap-3">
            <div className="flex justify-center">
              <MeasurementSession
                measurement={active.def}
                gridDone={activeGridDone}
                sartDone={activeSartDone}
              />
            </div>
          </section>
        ) : (
          <div className="rounded-lg border border-[var(--cell-border)] p-4 text-sm text-neutral-500">
            No hay ninguna medición disponible ahora mismo. Sigue avanzando en el
            protocolo para desbloquear la siguiente.
          </div>
        )}

        {/* Lista de mediciones */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-500">
            Todas las mediciones
          </h2>
          <ol className="flex flex-col gap-2">
            {states.map((s) => (
              <li
                key={s.def.index}
                className="rounded-lg border border-[var(--cell-border)] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{s.def.name}</span>
                  <StatusBadge status={s.status} />
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  {s.status === "done"
                    ? `Completa · ${s.doneParts}/${s.totalParts} pruebas`
                    : s.status === "available"
                      ? `En curso · ${s.doneParts}/${s.totalParts} pruebas`
                      : s.lockedReason}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Panel de transferencia: evolución M0 → M4 */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-500">
            Evolución (transferencia)
          </h2>
          <TransferPanel
            grids={transferChartGrids}
            sartRows={sartRows as SartRow[]}
          />
        </section>
      </main>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "locked" | "available" | "done";
}) {
  const map = {
    locked: { text: "Bloqueada", bg: "var(--cell-bg-hover)", fg: "var(--cell-text)" },
    available: { text: "Disponible", bg: "var(--foreground)", fg: "var(--background)" },
    done: { text: "Completa", bg: "var(--ok-bg)", fg: "var(--feedback-text)" },
  }[status];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: map.bg, color: map.fg }}
    >
      {map.text}
    </span>
  );
}
