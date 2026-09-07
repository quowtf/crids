/** Logica del grid L1: matriz 10x10 con 00-99 en orden aleatorio. */

/** Formatea un numero 0-99 como cadena de 2 digitos: 7 -> "07". */
export function formatCell(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Baraja un array in-place (Fisher-Yates). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Genera un grid L1: 100 numeros (0-99) barajados.
 * Devuelve el array de valores en orden de celda (fila por fila).
 */
export function generateL1Grid(): number[] {
  const cells = Array.from({ length: 100 }, (_, i) => i);
  return shuffle(cells);
}

/** Numero de objetivos de un grid L1. */
export const L1_TARGETS = 100;

/** Rendimiento = objetivos correctos por minuto. */
export function performance(targets: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  return targets / (durationMs / 60000);
}

/** Formatea milisegundos como m:ss. */
export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
