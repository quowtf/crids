/**
 * SART — Sustained Attention to Response Task (Prueba D de bases.md).
 *
 * Aparecen dígitos 0–9 uno a uno. El usuario debe responder (tap) a TODOS
 * salvo cuando aparece el dígito objetivo (no-go), donde debe INHIBIR.
 *
 * Mide atención sostenida y control inhibitorio:
 *  - omisiones: no respondió a un "go" (lapso de atención)
 *  - comisiones: respondió a un "no-go" (falla de inhibición, respuesta automática)
 *  - tiempo de reacción y su variabilidad
 */
import type { SessionContext } from "./types";

export const SART_TARGET_DIGIT = 3; // dígito objetivo (no-go)
export const SART_STIMULUS_MS = 1000; // cada estímulo visible este tiempo
export const SART_DURATION_MS = 3 * 60 * 1000; // 3 minutos
export const SART_NOGO_PROB = 0.18; // ~18% de estímulos son el objetivo

export interface SartResult {
  durationMs: number;
  targetDigit: number;
  totalStimuli: number;
  goTotal: number;
  nogoTotal: number;
  omissions: number;
  commissions: number;
  correctGo: number;
  meanRtMs: number | null;
  rtSdMs: number | null;
}

/** Genera el siguiente dígito: objetivo con prob NOGO, si no uno aleatorio ≠ objetivo. */
export function nextDigit(target: number): number {
  if (Math.random() < SART_NOGO_PROB) return target;
  let d = Math.floor(Math.random() * 10);
  if (d === target) d = (d + 1) % 10; // evita objetivo por azar en los "go"
  return d;
}

/** Calcula media y desviación estándar de una lista de RT. */
export function rtStats(rts: number[]): { mean: number | null; sd: number | null } {
  if (rts.length === 0) return { mean: null, sd: null };
  const mean = rts.reduce((a, b) => a + b, 0) / rts.length;
  const variance =
    rts.reduce((a, b) => a + (b - mean) ** 2, 0) / rts.length;
  return { mean, sd: Math.sqrt(variance) };
}

/** Datos para guardar un resultado SART. */
export interface NewSartResult extends Partial<SessionContext> {
  session_mode: "baseline" | "transfer" | "free";
  measurement_index?: number | null;
  duration_ms: number;
  target_digit: number;
  total_stimuli: number;
  go_total: number;
  nogo_total: number;
  omissions: number;
  commissions: number;
  correct_go: number;
  mean_rt_ms: number | null;
  rt_sd_ms: number | null;
}
