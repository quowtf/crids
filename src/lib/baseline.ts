/**
 * Fase 0 — Línea base (bases.md).
 * Mide tu punto de partida ANTES de entrenar, para poder comparar después.
 *
 * Pruebas:
 *   A — grid normal 00 → 99
 *   B — grid inverso 99 → 00
 *   C — búsqueda sin secuencia
 * Cada prueba se hace 2 veces (bases.md pide 2 intentos y promedio).
 *
 * Progreso derivado de los resultados guardados (mismo enfoque que el protocolo).
 */
import type { GameId } from "./games";
import type { BaselineTest, GridResult } from "./types";

export const BASELINE_ATTEMPTS = 2;

export interface BaselineTestDef {
  test: BaselineTest;
  name: string;
  description: string;
  gameId: GameId;
}

export const BASELINE_TESTS: BaselineTestDef[] = [
  {
    test: "A",
    name: "Prueba A — Grid normal",
    description: "Busca 00 → 99 en orden.",
    gameId: "L1",
  },
  {
    test: "B",
    name: "Prueba B — Grid inverso",
    description: "Busca 99 → 00 en orden.",
    gameId: "inverse",
  },
  {
    test: "C",
    name: "Prueba C — Sin secuencia",
    description: "Objetivos aislados, sin orden lógico.",
    gameId: "no-sequence",
  },
];

/** Un "paso" de la línea base: una prueba + número de intento. */
export interface BaselineStep {
  index: number; // 0-based global
  test: BaselineTest;
  attempt: number; // 1..BASELINE_ATTEMPTS
  def: BaselineTestDef;
}

/** Todos los pasos de la línea base, en orden (A1, A2, B1, B2, C1, C2). */
export const BASELINE_STEPS: BaselineStep[] = BASELINE_TESTS.flatMap((def) =>
  Array.from({ length: BASELINE_ATTEMPTS }, (_, i) => ({
    test: def.test,
    attempt: i + 1,
    def,
  })),
).map((s, index) => ({ index, ...s }));

export const BASELINE_TOTAL = BASELINE_STEPS.length;

export interface BaselineProgress {
  done: Set<string>; // claves "A-1", "A-2"...
  doneCount: number;
  total: number;
  currentIndex: number | null; // null = línea base completa
  finished: boolean;
}

function key(test: BaselineTest, attempt: number): string {
  return `${test}-${attempt}`;
}

/** Deriva el progreso de la línea base a partir de los resultados. */
export function deriveBaseline(results: GridResult[]): BaselineProgress {
  const done = new Set<string>();
  for (const r of results) {
    if (
      r.session_mode === "baseline" &&
      r.baseline_test &&
      r.baseline_attempt != null
    ) {
      done.add(key(r.baseline_test, r.baseline_attempt));
    }
  }

  let currentIndex: number | null = null;
  for (const step of BASELINE_STEPS) {
    if (!done.has(key(step.test, step.attempt))) {
      currentIndex = step.index;
      break;
    }
  }

  return {
    done,
    doneCount: done.size,
    total: BASELINE_TOTAL,
    currentIndex,
    finished: currentIndex === null,
  };
}

export function baselineStep(index: number): BaselineStep | null {
  return BASELINE_STEPS[index] ?? null;
}

export function baselineStepKey(test: BaselineTest, attempt: number): string {
  return key(test, attempt);
}
