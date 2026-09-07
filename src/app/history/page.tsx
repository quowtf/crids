import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import HistoryChart, { type ChartPoint } from "@/components/HistoryChart";
import { formatDuration } from "@/lib/grid";
import type { GridResult } from "@/lib/types";
import { GAMES } from "@/lib/games";
import { VISUAL_LABELS } from "@/lib/visual";
import {
  FORM_TIMING_LABELS,
  FINISH_REASON_LABELS,
} from "@/lib/experiment";

const GAME_NAMES = new Map(GAMES.map((g) => [g.id, g.name]));

function gameName(id: string): string {
  return GAME_NAMES.get(id as never) ?? id;
}

function visualLabel(mode: string | null): string {
  if (!mode) return "";
  return VISUAL_LABELS[mode as keyof typeof VISUAL_LABELS] ?? mode;
}

function finishLabel(reason: string | null): string {
  if (!reason) return "—";
  return FINISH_REASON_LABELS[reason as keyof typeof FINISH_REASON_LABELS] ?? reason;
}

function variantLabel(v: string | null): string {
  if (!v) return "—";
  return FORM_TIMING_LABELS[v as keyof typeof FORM_TIMING_LABELS] ?? v;
}

/** Resume el contexto pre-prueba en una linea compacta. */
function formatContext(r: GridResult): string {
  const parts: string[] = [];
  if (r.sleep_hours != null) parts.push(`💤 ${r.sleep_hours}h`);
  if (r.fatigue != null) parts.push(`fat ${r.fatigue}`);
  if (r.stress != null) parts.push(`str ${r.stress}`);
  if (r.caffeine != null)
    parts.push(
      r.caffeine
        ? `☕ ${r.caffeine_hours_ago != null ? `${r.caffeine_hours_ago}h` : "sí"}`
        : "sin café",
    );
  if (r.exercised != null)
    parts.push(
      r.exercised
        ? `🏃 ${r.exercise_hours_ago != null ? `${r.exercise_hours_ago}h` : "sí"}`
        : "sin ejerc.",
    );
  return parts.length ? parts.join(" · ") : "—";
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("grid_results")
    .select("*")
    .order("created_at", { ascending: true });

  const results = (data ?? []) as GridResult[];

  // La grafica va en orden cronologico (ascendente). Numeramos las sesiones.
  const chartData: ChartPoint[] = results.map((r, i) => ({
    label: `#${i + 1}`,
    seconds: Math.round(r.duration_ms / 1000),
    errors: r.errors,
  }));

  // La tabla muestra lo mas reciente primero.
  const rows = [...results].reverse();

  return (
    <div className="min-h-dvh">
      <NavBar email={user?.email} />
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8">
        <div>
          <h1 className="text-xl font-semibold">Historial</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Evolución de tiempo y errores por sesión.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600">
            Error al cargar el historial: {error.message}
          </p>
        )}

        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-500">
            Tiempo (azul) y errores (rojo)
          </h2>
          <HistoryChart data={chartData} />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-500">
            Sesiones ({results.length})
          </h2>
          {rows.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Todavía no has completado ningún grid.{" "}
              <a href="/train" className="underline">
                Empieza a entrenar
              </a>
              .
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-neutral-500">
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="py-2 pr-4 font-medium">Fecha</th>
                    <th className="py-2 pr-4 font-medium">Juego</th>
                    <th className="py-2 pr-4 font-medium">Visual</th>
                    <th className="py-2 pr-4 font-medium">Tiempo</th>
                    <th className="py-2 pr-4 font-medium">Errores</th>
                    <th className="py-2 pr-4 font-medium">Aciertos</th>
                    <th className="py-2 pr-4 font-medium">Fin</th>
                    <th className="py-2 pr-4 font-medium">Variante</th>
                    <th className="py-2 font-medium">Contexto</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-neutral-100 dark:border-neutral-900"
                    >
                      <td className="py-2 pr-4 tabular-nums">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">{gameName(r.grid_type)}</td>
                      <td className="py-2 pr-4 text-xs text-neutral-500">
                        {visualLabel(r.visual_mode)}
                      </td>
                      <td className="py-2 pr-4 font-mono tabular-nums">
                        {formatDuration(r.duration_ms)}
                      </td>
                      <td className="py-2 pr-4 font-mono tabular-nums">
                        {r.errors}
                      </td>
                      <td className="py-2 pr-4 font-mono tabular-nums">
                        {r.completed_targets ?? r.targets}/{r.targets}
                      </td>
                      <td className="py-2 pr-4 text-xs text-neutral-500">
                        {finishLabel(r.finished_reason)}
                      </td>
                      <td className="py-2 pr-4 text-xs text-neutral-500">
                        {variantLabel(r.ab_variant)}
                      </td>
                      <td className="py-2 text-xs text-neutral-500">
                        {formatContext(r)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
