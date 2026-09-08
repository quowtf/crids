"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDuration } from "@/lib/grid";
import {
  generateGame,
  memoryChunkRange,
  type GameId,
  type GameRun,
} from "@/lib/games";
import { VISUAL_STYLES, type VisualMode } from "@/lib/visual";

import type { FinishReason } from "@/lib/experiment";

export interface GridRunResult {
  durationMs: number;
  errors: number;
  targets: number; // objetivos totales del grid
  completedTargets: number; // objetivos acertados
  reason: FinishReason;
}

// idle -> (memorizing) -> running -> done
type Status = "idle" | "memorizing" | "running" | "done";

interface Props {
  gameId: GameId;
  visual: VisualMode;
  onFinish: (result: GridRunResult) => void;
  /** Mostrar cronometro y errores en vivo. Por ahora siempre false. */
  showStats?: boolean;
  /** L0: apagar (atenuar) las celdas ya encontradas. */
  dimFound?: boolean;
}

// Tiempo de memorización según el tamaño de la tanda (más números, más tiempo).
function memorizeMs(chunkSize: number): number {
  return Math.max(2000, chunkSize * 1500);
}

export default function Grid({
  gameId,
  visual,
  onFinish,
  showStats = false,
  dimFound = true,
}: Props) {
  const [run, setRun] = useState<GameRun>(() => generateGame(gameId));
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState(0); // indice dentro de run.sequence
  const [errors, setErrors] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [found, setFound] = useState<Set<number>>(() => new Set());
  const [flash, setFlash] = useState<Record<number, "ok" | "wrong">>({});
  const [showSwitch, setShowSwitch] = useState(false); // aviso CAMBIO
  const [memCountdown, setMemCountdown] = useState(0); // seg restantes memorizando

  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const errorsRef = useRef(0);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    errorsRef.current = errors;
  }, [errors]);

  const targetLabel = run.sequence[step] ?? null;
  const vs = VISUAL_STYLES[visual];

  const isMemoryGame = run.memoryChunks != null;
  const chunks = useMemo(() => run.memoryChunks ?? [], [run.memoryChunks]);

  // Rango [start, end) de la tanda de memoria actual.
  const chunkRange = useMemo(
    () =>
      isMemoryGame
        ? memoryChunkRange(step, chunks)
        : { start: 0, end: 0 },
    [isMemoryGame, step, chunks],
  );

  // Labels de la tanda actual (para mostrar y resaltar).
  const chunkLabels = useMemo(
    () => run.sequence.slice(chunkRange.start, chunkRange.end),
    [run.sequence, chunkRange.start, chunkRange.end],
  );

  // Índices de celda que forman la tanda de memoria actual (para resaltar).
  const currentChunkIdx = useMemo(() => {
    if (!isMemoryGame) return new Set<number>();
    const set = new Set<number>();
    chunkLabels.forEach((lab) => {
      const i = run.cells.findIndex((c) => c.label === lab);
      if (i >= 0) set.add(i);
    });
    return set;
  }, [isMemoryGame, chunkLabels, run.cells]);

  // Cronómetro mientras corre.
  useEffect(() => {
    if (status !== "running") return;
    const tick = () => {
      setElapsed(Date.now() - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status]);

  const resetState = useCallback((newRun: GameRun) => {
    setRun(newRun);
    setStatus("idle");
    setStep(0);
    setErrors(0);
    setElapsed(0);
    setFound(new Set());
    setFlash({});
    setShowSwitch(false);
    setMemCountdown(0);
  }, []);

  const reset = useCallback(() => {
    resetState(generateGame(gameId));
  }, [gameId, resetState]);

  // Arranca la búsqueda (cronómetro corre desde aquí).
  const beginRunning = useCallback(() => {
    startRef.current = Date.now();
    setStatus("running");
    setElapsed(0);
  }, []);

  // ms de memorización de la tanda actual (leído por el temporizador).
  const memMsRef = useRef(2000);

  // Inicia la fase de memorización; su duración depende del tamaño de la tanda.
  const beginMemorizing = useCallback(
    (chunkSize: number) => {
      const ms = memorizeMs(chunkSize);
      memMsRef.current = ms;
      setStatus("memorizing");
      setMemCountdown(Math.ceil(ms / 1000));
    },
    [],
  );

  // Botón Empezar: memoria -> memorizar la primera tanda; resto -> buscar.
  const start = useCallback(() => {
    if (isMemoryGame) beginMemorizing(chunks[0] ?? 0);
    else beginRunning();
  }, [isMemoryGame, chunks, beginMemorizing, beginRunning]);

  // Fase de memorización: un temporizador pasa a buscar; un intervalo actualiza
  // el contador visual. Nada de setState sincrónico en el cuerpo del effect.
  useEffect(() => {
    if (status !== "memorizing") return;
    const toRun = setTimeout(beginRunning, memMsRef.current);
    const interval = setInterval(() => {
      setMemCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => {
      clearTimeout(toRun);
      clearInterval(interval);
    };
  }, [status, beginRunning]);

  const finishManually = useCallback(() => {
    if (status !== "running") return;
    const durationMs = Date.now() - startRef.current;
    setElapsed(durationMs);
    setStatus("done");
    onFinish({
      durationMs,
      errors: errorsRef.current,
      targets: run.sequence.length,
      completedTargets: stepRef.current,
      reason: "manual",
    });
  }, [status, run.sequence.length, onFinish]);

  const flashCell = useCallback((idx: number, kind: "ok" | "wrong") => {
    setFlash((f) => ({ ...f, [idx]: kind }));
    setTimeout(() => {
      setFlash((f) => {
        const next = { ...f };
        delete next[idx];
        return next;
      });
    }, 250);
  }, []);

  const handleCell = useCallback(
    (idx: number, label: string) => {
      if (status !== "running" || targetLabel == null) return;

      if (label === targetLabel) {
        flashCell(idx, "ok");
        setFound((prev) => {
          const next = new Set(prev);
          next.add(idx);
          return next;
        });
        const nextStep = step + 1;

        if (nextStep >= run.sequence.length) {
          const durationMs = Date.now() - startRef.current;
          setElapsed(durationMs);
          setStatus("done");
          onFinish({
            durationMs,
            errors,
            targets: run.sequence.length,
            completedTargets: nextStep,
            reason: "completed",
          });
          return;
        }

        // Regla cambiante: avisar CAMBIO al cruzar el punto.
        if (run.ruleSwitchAtStep != null && nextStep === run.ruleSwitchAtStep) {
          setShowSwitch(true);
          setTimeout(() => setShowSwitch(false), 1500);
        }

        // Memoria: si terminó la tanda actual, memorizar la siguiente.
        if (isMemoryGame && nextStep === chunkRange.end) {
          setStep(nextStep);
          const nextRange = memoryChunkRange(nextStep, chunks);
          beginMemorizing(nextRange.end - nextRange.start);
          return;
        }

        setStep(nextStep);
      } else {
        flashCell(idx, "wrong");
        setErrors((e) => e + 1);
      }
    },
    [
      status,
      targetLabel,
      step,
      errors,
      run.sequence.length,
      run.ruleSwitchAtStep,
      isMemoryGame,
      chunkRange.end,
      chunks,
      flashCell,
      onFinish,
      beginMemorizing,
    ],
  );

  const cols = useMemo(() => {
    const n = run.cells.length;
    return Math.round(Math.sqrt(n)) || 10;
  }, [run.cells.length]);

  // ¿Se muestra el objetivo actual arriba?
  const hideTargetLabel = run.hideTarget && status === "running";

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* Barra superior */}
      <div className="flex min-h-[64px] w-full items-center justify-center gap-8 text-sm">
        {status === "memorizing" ? (
          <div className="flex flex-col items-center">
            <span className="text-neutral-500">
              Memoriza {chunkLabels.length}
            </span>
            <span className="font-mono text-2xl font-bold tabular-nums">
              {chunkLabels.join(" · ")}
            </span>
            <span className="mt-1 text-xs text-neutral-500">
              {memCountdown}s
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-neutral-500">
              {hideTargetLabel ? "Encuentra (de memoria)" : "Buscar"}
            </span>
            <span className="font-mono text-4xl font-bold tabular-nums">
              {status === "done"
                ? "✓"
                : hideTargetLabel
                  ? "?"
                  : (targetLabel ?? "—")}
            </span>
          </div>
        )}

        {showStats && (
          <>
            <div className="flex flex-col items-center">
              <span className="text-neutral-500">Tiempo</span>
              <span className="font-mono text-4xl tabular-nums">
                {formatDuration(elapsed)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-neutral-500">Errores</span>
              <span className="font-mono text-4xl tabular-nums">{errors}</span>
            </div>
          </>
        )}
      </div>

      {/* Aviso CAMBIO (regla cambiante) */}
      {showSwitch && (
        <div
          className="w-full max-w-[min(94vw,560px)] rounded-md py-2 text-center text-lg font-bold"
          style={{ backgroundColor: "var(--wrong-bg)", color: "var(--feedback-text)" }}
        >
          CAMBIO — ahora descendente
        </div>
      )}

      {/* Grid */}
      <div
        className={`grid w-full max-w-[min(94vw,560px)] touch-none select-none ${vs.gap}`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {run.cells.map((cell, idx) => {
          const state = flash[idx];
          const isFound = found.has(idx);
          const done = status === "done";
          const dimmed = dimFound && isFound;
          const hidden = status === "idle";
          const memHighlight =
            status === "memorizing" && currentChunkIdx.has(idx);

          let style: React.CSSProperties;
          if (state) {
            style = {
              backgroundColor:
                state === "ok" ? "var(--ok-bg)" : "var(--wrong-bg)",
              color: "var(--feedback-text)",
              borderColor: "transparent",
            };
          } else if (memHighlight) {
            // Resaltar los números a memorizar.
            style = {
              backgroundColor: "var(--foreground)",
              color: "var(--background)",
              borderColor: "transparent",
            };
          } else if (dimmed) {
            style = {
              backgroundColor: "var(--background)",
              color: "transparent",
              borderColor: "transparent",
            };
          } else {
            // En memorizing (no resaltada) e idle ocultamos el número.
            const hideNum = hidden || status === "memorizing";
            style = {
              backgroundColor: "var(--cell-bg)",
              color: hideNum ? "transparent" : "var(--cell-text)",
              borderColor: "var(--cell-border)",
            };
          }

          // Ocultos antes de empezar; en memorizing solo se ven los resaltados;
          // al buscar los números del grid siempre son visibles.
          const showLabel =
            !hidden && !(status === "memorizing" && !memHighlight);

          return (
            <button
              key={idx}
              type="button"
              disabled={status !== "running" || dimmed}
              onPointerDown={(e) => {
                e.preventDefault();
                handleCell(idx, cell.label);
              }}
              style={style}
              className={[
                "flex aspect-square items-center justify-center rounded-md border font-mono font-semibold tabular-nums transition-colors",
                vs.fontClamp,
                !state && !dimmed && !hidden && status !== "memorizing"
                  ? vs.textOpacity
                  : "",
                done && !dimmed ? "opacity-60" : "",
              ].join(" ")}
            >
              {showLabel ? cell.label : ""}
            </button>
          );
        })}
      </div>

      {/* Controles */}
      <div className="flex gap-3">
        {status === "idle" && (
          <button
            type="button"
            onClick={start}
            className="rounded-lg bg-[var(--foreground)] px-8 py-3 text-base font-medium text-[var(--background)] transition hover:opacity-85 active:opacity-75"
          >
            Empezar
          </button>
        )}
        {status === "running" && (
          <button
            type="button"
            onClick={finishManually}
            className="rounded-lg bg-[var(--foreground)] px-8 py-3 text-base font-medium text-[var(--background)] transition hover:opacity-85 active:opacity-75"
          >
            Finalizar
          </button>
        )}
        {(status === "running" || status === "done") && (
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-[var(--cell-border)] px-8 py-3 text-base font-medium transition hover:bg-[var(--cell-bg-hover)]"
          >
            {status === "done" ? "Nuevo grid" : "Reiniciar"}
          </button>
        )}
      </div>
    </div>
  );
}
