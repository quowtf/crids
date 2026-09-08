/**
 * Serie de transferencia: evolución de cada prueba a través de las mediciones.
 * Punto 0 = línea base (baseline). Puntos 1..5 = mediciones (transfer).
 *
 * Permite ver si mejoras en las pruebas que NO entrenaste directamente
 * (el corazón del experimento de bases.md).
 */
import type { GridResult, BaselineTest } from "./types";

/** Fila mínima de attention_tests que necesitamos. */
export interface SartRow {
  session_mode: string | null;
  measurement_index: number | null;
  omissions: number;
  commissions: number;
  mean_rt_ms: number | null;
}

export interface TransferPoint {
  /** Etiqueta de la medición: "M0" (base), "M1"… */
  label: string;
  /** Índice: 0 = base, 1..5 mediciones. */
  m: number;
  [key: string]: number | string | null;
}

/** Series para las pruebas de grid (A/B/C): tiempo y errores medios por medición. */
export interface GridSeriesPoint extends TransferPoint {
  seconds: number | null;
  errors: number | null;
}

/** Serie para la prueba D: omisiones, comisiones, RT por medición. */
export interface SartSeriesPoint extends TransferPoint {
  omissions: number | null;
  commissions: number | null;
  rt: number | null;
}

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** m=0 para baseline, m=measurement_index para transfer, null si no aplica. */
function pointIndex(r: {
  session_mode: string | null;
  measurement_index: number | null;
}): number | null {
  if (r.session_mode === "baseline") return 0;
  if (r.session_mode === "transfer" && r.measurement_index != null)
    return r.measurement_index;
  return null;
}

const POINTS: TransferPoint[] = [
  { label: "M0", m: 0 },
  { label: "M1", m: 1 },
  { label: "M2", m: 2 },
  { label: "M3", m: 3 },
  { label: "M4", m: 4 },
  { label: "Desentr.", m: 5 },
];

/** Serie de una prueba de grid concreta (A, B o C). */
export function gridTransferSeries(
  results: GridResult[],
  test: BaselineTest,
): GridSeriesPoint[] {
  return POINTS.map((p) => {
    const rows = results.filter(
      (r) => r.baseline_test === test && pointIndex(r) === p.m,
    );
    const secs = mean(rows.map((r) => r.duration_ms / 1000));
    const errs = mean(rows.map((r) => r.errors));
    return {
      ...p,
      seconds: secs == null ? null : Math.round(secs),
      errors: errs == null ? null : Math.round(errs * 10) / 10,
    };
  });
}

/** Serie de la prueba D (SART). */
export function sartTransferSeries(rows: SartRow[]): SartSeriesPoint[] {
  return POINTS.map((p) => {
    const rs = rows.filter((r) => pointIndex(r) === p.m);
    const om = mean(rs.map((r) => r.omissions));
    const co = mean(rs.map((r) => r.commissions));
    const rt = mean(
      rs.map((r) => r.mean_rt_ms).filter((v): v is number => v != null),
    );
    return {
      ...p,
      omissions: om == null ? null : Math.round(om * 10) / 10,
      commissions: co == null ? null : Math.round(co * 10) / 10,
      rt: rt == null ? null : Math.round(rt),
    };
  });
}

/** ¿Hay al menos un punto con datos? Para decidir si mostrar la gráfica. */
export function hasAnyData<T extends Record<string, unknown>>(
  points: T[],
  keys: (keyof T)[],
): boolean {
  return points.some((p) => keys.some((k) => p[k] != null));
}
