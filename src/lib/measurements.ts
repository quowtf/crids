/**
 * Mediciones de transferencia + desentrenamiento (bases.md).
 *
 * En vez de anclarlas al calendario (semanas 2/4/6/8), se anclan al PROGRESO
 * del protocolo, coherente con la filosofía "avanza a tu ritmo":
 *   M1 al completar 10 pasos, M2 a los 20, M3 a los 30, M4 a los 40.
 * El desentrenamiento (M5) se desbloquea tras M4 y ≥7 días sin entrenar.
 *
 * Cada medición repite la batería A/B/C (1 intento) + D (SART).
 * La línea base (fase 0) es la medición 0 y vive en /baseline.
 */
import type { GameId } from "./games";
import type { BaselineTest, GridResult } from "./types";

export interface MeasurementDef {
  index: number; // 1..5
  name: string;
  unlockAtSteps: number; // pasos de protocolo necesarios
  isDetraining?: boolean;
  detrainingDays?: number; // días mínimos sin entrenar (solo desentrenamiento)
}

export const MEASUREMENTS: MeasurementDef[] = [
  { index: 1, name: "Medición 1", unlockAtSteps: 10 },
  { index: 2, name: "Medición 2", unlockAtSteps: 20 },
  { index: 3, name: "Medición 3", unlockAtSteps: 30 },
  { index: 4, name: "Medición 4 (fin)", unlockAtSteps: 40 },
  {
    index: 5,
    name: "Desentrenamiento",
    unlockAtSteps: 40,
    isDetraining: true,
    detrainingDays: 7,
  },
];

/** Batería de una medición: A/B/C (grid) + D (SART). */
export interface MeasurementGridTest {
  test: BaselineTest;
  name: string;
  gameId: GameId;
}

export const MEASUREMENT_GRID_TESTS: MeasurementGridTest[] = [
  { test: "A", name: "Prueba A — Grid normal", gameId: "L1" },
  { test: "B", name: "Prueba B — Grid inverso", gameId: "inverse" },
  { test: "C", name: "Prueba C — Sin secuencia", gameId: "no-sequence" },
];

export type MeasurementStatus = "locked" | "available" | "done";

export interface MeasurementState {
  def: MeasurementDef;
  status: MeasurementStatus;
  /** Qué falta para desbloquear (texto), si está locked. */
  lockedReason?: string;
  /** Sub-progreso: cuántas de las 4 pruebas (A/B/C/D) hechas. */
  doneParts: number;
  totalParts: number; // 4
}

interface DeriveInput {
  /** Pasos de protocolo completados. */
  protocolSteps: number;
  /** Resultados de grid en modo transfer. */
  transferGrids: GridResult[];
  /** ¿Hay SART transfer para cada índice? set de measurement_index. */
  sartByMeasurement: Set<number>;
  /** Fecha del último resultado de protocolo (para desentrenamiento). */
  lastProtocolAt: Date | null;
  /** Ahora (para calcular días). */
  now: Date;
}

/** Cuántas pruebas A/B/C hechas para una medición. */
function gridPartsDone(grids: GridResult[], index: number): Set<BaselineTest> {
  const s = new Set<BaselineTest>();
  for (const r of grids) {
    if (r.measurement_index === index && r.baseline_test) {
      s.add(r.baseline_test);
    }
  }
  return s;
}

export function deriveMeasurements(input: DeriveInput): MeasurementState[] {
  return MEASUREMENTS.map((def) => {
    const gridDone = gridPartsDone(input.transferGrids, def.index);
    const sartDone = input.sartByMeasurement.has(def.index);
    const doneParts = gridDone.size + (sartDone ? 1 : 0);
    const totalParts = MEASUREMENT_GRID_TESTS.length + 1; // A/B/C + D = 4

    let status: MeasurementStatus;
    let lockedReason: string | undefined;

    if (doneParts >= totalParts) {
      status = "done";
    } else if (input.protocolSteps < def.unlockAtSteps) {
      status = "locked";
      lockedReason = `Completa ${def.unlockAtSteps} ejercicios del protocolo (llevas ${input.protocolSteps}).`;
    } else if (def.isDetraining) {
      // Requiere días sin entrenar desde el último protocolo.
      const days =
        input.lastProtocolAt == null
          ? Infinity
          : (input.now.getTime() - input.lastProtocolAt.getTime()) /
            86400000;
      if (days < (def.detrainingDays ?? 7)) {
        status = "locked";
        const faltan = Math.ceil((def.detrainingDays ?? 7) - days);
        lockedReason = `Descansa del protocolo. Faltan ~${faltan} día(s) sin entrenar.`;
      } else {
        status = "available";
      }
    } else {
      status = "available";
    }

    return { def, status, lockedReason, doneParts, totalParts };
  });
}
