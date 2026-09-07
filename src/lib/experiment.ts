/**
 * A/B test: "form_timing".
 * Controla si el formulario de contexto (estado pre/post) se muestra y cuándo.
 *
 * Variantes (asignadas aleatoriamente por sesión):
 *   - "start": el formulario aparece ANTES del grid.
 *   - "end":   el formulario aparece AL TERMINAR (completar o finalizar).
 *   - "none":  no se muestra formulario.
 *
 * El formulario nunca se muestra dos veces: la variante decide un único momento.
 */
export type FormTiming = "start" | "end" | "none";

export const FORM_TIMINGS: FormTiming[] = ["start", "end", "none"];

/** Asigna una variante al azar (uniforme) para una nueva sesión. */
export function assignFormTiming(): FormTiming {
  const i = Math.floor(Math.random() * FORM_TIMINGS.length);
  return FORM_TIMINGS[i];
}

export const FORM_TIMING_LABELS: Record<FormTiming, string> = {
  start: "Formulario al inicio",
  end: "Formulario al final",
  none: "Sin formulario",
};

/** Motivo por el que terminó la sesión. */
export type FinishReason = "completed" | "manual";

export const FINISH_REASON_LABELS: Record<FinishReason, string> = {
  completed: "Completado",
  manual: "Finalizado a mano",
};
