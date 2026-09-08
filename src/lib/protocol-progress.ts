import type { GridResult } from "./types";
import { PROTOCOL_TOTAL } from "./protocol";

/**
 * Deriva el progreso del protocolo a partir de los resultados guardados.
 * Un paso está cumplido si existe algún resultado modo protocolo con ese
 * protocol_step. El paso "actual" es el primer índice no cumplido.
 */
export interface ProtocolProgress {
  completed: Set<number>;
  completedCount: number;
  total: number;
  currentIndex: number | null; // null = protocolo terminado
  finished: boolean;
}

export function deriveProgress(results: GridResult[]): ProtocolProgress {
  const completed = new Set<number>();
  for (const r of results) {
    if (r.session_mode === "protocol" && r.protocol_step != null) {
      completed.add(r.protocol_step);
    }
  }

  // Primer índice no cumplido.
  let currentIndex: number | null = null;
  for (let i = 0; i < PROTOCOL_TOTAL; i++) {
    if (!completed.has(i)) {
      currentIndex = i;
      break;
    }
  }

  return {
    completed,
    completedCount: completed.size,
    total: PROTOCOL_TOTAL,
    currentIndex,
    finished: currentIndex === null,
  };
}
