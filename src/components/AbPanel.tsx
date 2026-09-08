import { formatDuration } from "@/lib/grid";
import { FORM_TIMING_LABELS } from "@/lib/experiment";
import type { VariantStats } from "@/lib/stats";

function fmtDur(ms: number | null): string {
  return ms == null ? "—" : formatDuration(Math.round(ms));
}

function fmtNum(n: number | null, digits = 1): string {
  return n == null ? "—" : n.toFixed(digits);
}

function fmtPct(frac: number | null): string {
  return frac == null ? "—" : `${Math.round(frac * 100)}%`;
}

/**
 * Panel del A/B test "form_timing": compara las variantes
 * (formulario al inicio / al final / sin formulario).
 */
export default function AbPanel({ stats }: { stats: VariantStats[] }) {
  const totalSessions = stats.reduce((a, s) => a + s.sessions, 0);

  return (
    <section>
      <h2 className="mb-1 text-sm font-medium text-neutral-500">
        A/B test — momento del formulario
      </h2>
      <p className="mb-3 text-xs text-neutral-500">
        Cada sesión se asigna al azar a una variante. Compara si el momento del
        formulario cambia tu rendimiento. Con pocas sesiones, las diferencias son
        ruido: junta datos antes de concluir.
      </p>

      {totalSessions === 0 ? (
        <p className="text-sm text-neutral-500">
          Aún no hay sesiones para comparar.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr className="border-b border-[var(--cell-border)]">
                <th className="py-2 pr-4 font-medium">Variante</th>
                <th className="py-2 pr-4 font-medium">Sesiones</th>
                <th className="py-2 pr-4 font-medium">Tiempo medio</th>
                <th className="py-2 pr-4 font-medium">Errores medios</th>
                <th className="py-2 pr-4 font-medium">Aciertos medios</th>
                <th className="py-2 font-medium">% completadas</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr
                  key={s.variant}
                  className="border-b border-[var(--cell-border)]/50"
                >
                  <td className="py-2 pr-4">{FORM_TIMING_LABELS[s.variant]}</td>
                  <td className="py-2 pr-4 font-mono tabular-nums">
                    {s.sessions}
                  </td>
                  <td className="py-2 pr-4 font-mono tabular-nums">
                    {fmtDur(s.avgDurationMs)}
                  </td>
                  <td className="py-2 pr-4 font-mono tabular-nums">
                    {fmtNum(s.avgErrors)}
                  </td>
                  <td className="py-2 pr-4 font-mono tabular-nums">
                    {fmtNum(s.avgCompletedTargets)}
                  </td>
                  <td className="py-2 font-mono tabular-nums">
                    {fmtPct(s.completedRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
