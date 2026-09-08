import type { GridResult } from "./types";
import { FORM_TIMINGS, type FormTiming } from "./experiment";

export interface VariantStats {
  variant: FormTiming;
  sessions: number;
  avgDurationMs: number | null;
  avgErrors: number | null;
  avgCompletedTargets: number | null;
  completedRate: number | null; // fracción terminadas por completar (no manual)
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Agrupa resultados por variante A/B y calcula métricas comparables. */
export function statsByVariant(results: GridResult[]): VariantStats[] {
  return FORM_TIMINGS.map((variant) => {
    const rows = results.filter((r) => r.ab_variant === variant);
    const completedCount = rows.filter(
      (r) => r.finished_reason === "completed",
    ).length;

    return {
      variant,
      sessions: rows.length,
      avgDurationMs: avg(rows.map((r) => r.duration_ms)),
      avgErrors: avg(rows.map((r) => r.errors)),
      avgCompletedTargets: avg(
        rows.map((r) => r.completed_targets ?? r.targets),
      ),
      completedRate: rows.length ? completedCount / rows.length : null,
    };
  });
}
