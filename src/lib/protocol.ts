/**
 * Protocolo de entrenamiento (basado en bases.md, semanas 1–8).
 *
 * Filosofía de progreso: se cuenta por EJERCICIOS CUMPLIDOS, no por días.
 * El plan es una lista ordenada de pasos; el usuario avanza al ritmo que pueda
 * (uno por semana o varios en un día, da igual). El paso "actual" es el primer
 * paso todavía no cumplido.
 *
 * Esta es la fase 1: bloque de entrenamiento. La línea base (fase 0), las
 * pruebas de transferencia y el desentrenamiento se añadirán después.
 */
import type { GameId } from "./games";
import type { VisualMode } from "./visual";

export interface ProtocolStep {
  /** Índice global 0-based dentro del plan. */
  index: number;
  /** Semana a la que pertenece (1–8), solo informativo. */
  week: number;
  /** Bloque temático de la semana. */
  block: string;
  /** Juego a ejecutar. */
  gameId: GameId;
  /** Modo visual sugerido. */
  visual: VisualMode;
  /** Apagar celdas acertadas. */
  dimFound: boolean;
  /** Descripción corta del ejercicio. */
  label: string;
}

// Plantilla por semana: 5 ejercicios/semana según bases.md.
// (miércoles y fin de semana son descanso, así que 5 sesiones activas.)
interface WeekTemplate {
  week: number;
  block: string;
  sessions: {
    gameId: GameId;
    visual: VisualMode;
    dimFound: boolean;
    label: string;
  }[];
}

const WEEKS: WeekTemplate[] = [
  // Semanas 1–2 — Fundamentos
  ...[1, 2].map((week) => ({
    week,
    block: "Fundamentos",
    sessions: [
      { gameId: "L1" as GameId, visual: "normal" as VisualMode, dimFound: true, label: "Búsqueda 00 → 99" },
      { gameId: "inverse" as GameId, visual: "normal" as VisualMode, dimFound: true, label: "Inverso 99 → 00" },
      { gameId: "L1" as GameId, visual: "load" as VisualMode, dimFound: true, label: "00 → 99 con carga visual" },
      { gameId: "inverse" as GameId, visual: "load" as VisualMode, dimFound: true, label: "Inverso con carga visual" },
      { gameId: "L1" as GameId, visual: "normal" as VisualMode, dimFound: false, label: "00 → 99 sin apagar celdas" },
    ],
  })),
  // Semanas 3–4 — Alternancia
  ...[3, 4].map((week) => ({
    week,
    block: "Alternancia",
    sessions: [
      { gameId: "alternating" as GameId, visual: "normal" as VisualMode, dimFound: true, label: "Alternante 00 → 99 → 01 → 98…" },
      { gameId: "letters" as GameId, visual: "normal" as VisualMode, dimFound: true, label: "Número + letra" },
      { gameId: "alternating" as GameId, visual: "load" as VisualMode, dimFound: true, label: "Alternante con carga visual" },
      { gameId: "letters" as GameId, visual: "load" as VisualMode, dimFound: true, label: "Número + letra con carga visual" },
      { gameId: "L1" as GameId, visual: "normal" as VisualMode, dimFound: true, label: "Base 00 → 99 (control)" },
    ],
  })),
  // Semanas 5–6 — Memoria de trabajo
  ...[5, 6].map((week) => ({
    week,
    block: "Memoria de trabajo",
    sessions: [
      { gameId: "memory" as GameId, visual: "normal" as VisualMode, dimFound: true, label: "Memoria carga creciente 2→5" },
      { gameId: "memory" as GameId, visual: "normal" as VisualMode, dimFound: true, label: "Memoria carga creciente 2→5" },
      { gameId: "no-sequence" as GameId, visual: "normal" as VisualMode, dimFound: true, label: "Búsqueda sin secuencia" },
      { gameId: "memory" as GameId, visual: "load" as VisualMode, dimFound: true, label: "Memoria con carga visual" },
      { gameId: "L1" as GameId, visual: "normal" as VisualMode, dimFound: true, label: "Base 00 → 99 (control)" },
    ],
  })),
  // Semanas 7–8 — Integración
  ...[7, 8].map((week) => ({
    week,
    block: "Integración",
    sessions: [
      { gameId: "rule-switch" as GameId, visual: "normal" as VisualMode, dimFound: true, label: "Regla cambiante" },
      { gameId: "distractors" as GameId, visual: "normal" as VisualMode, dimFound: true, label: "Distractores" },
      { gameId: "rule-switch" as GameId, visual: "load" as VisualMode, dimFound: true, label: "Regla cambiante con carga visual" },
      { gameId: "memory" as GameId, visual: "load" as VisualMode, dimFound: true, label: "Memoria con carga visual" },
      { gameId: "distractors" as GameId, visual: "load" as VisualMode, dimFound: true, label: "Distractores con carga visual" },
    ],
  })),
];

/** Plan completo aplanado a una lista de pasos ordenados. */
export const PROTOCOL_STEPS: ProtocolStep[] = WEEKS.flatMap((w) =>
  w.sessions.map((s) => ({
    week: w.week,
    block: w.block,
    ...s,
  })),
).map((step, index) => ({ index, ...step }));

export const PROTOCOL_TOTAL = PROTOCOL_STEPS.length;

/** Devuelve el paso por índice, o null si está fuera de rango (plan terminado). */
export function protocolStep(index: number): ProtocolStep | null {
  return PROTOCOL_STEPS[index] ?? null;
}
