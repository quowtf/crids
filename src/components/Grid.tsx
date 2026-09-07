"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDuration } from "@/lib/grid";
import { generateGame, type GameId, type GameRun } from "@/lib/games";
import { VISUAL_STYLES, type VisualMode } from "@/lib/visual";

import type { FinishReason } from "@/lib/experiment";

export interface GridRunResult {
  durationMs: number;
  errors: number;
  targets: number; // objetivos totales del grid
  completedTargets: number; // objetivos acertados
  reason: FinishReason;
}

type Status = "idle" | "running" | "done";

interface Props {
  gameId: GameId;
  visual: VisualMode;
  onFinish: (result: GridRunResult) => void;
  /** Mostrar cronometro y errores en vivo. Por ahora siempre false. */
  showStats?: boolean;
  /** L0: apagar (atenuar) las celdas ya encontradas. */
  dimFound?: boolean;
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

  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  // Refs para leer valores actuales al finalizar manualmente (evita stale closure).
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

  const reset = useCallback(() => {
    setRun(generateGame(gameId));
    setStatus("idle");
    setStep(0);
    setErrors(0);
    setElapsed(0);
    setFound(new Set());
    setFlash({});
  }, [gameId]);

  const start = useCallback(() => {
    startRef.current = Date.now();
    setStatus("running");
    setElapsed(0);
  }, []);

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
        } else {
          setStep(nextStep);
        }
      } else {
        flashCell(idx, "wrong");
        setErrors((e) => e + 1);
      }
    },
    [status, targetLabel, step, errors, run.sequence.length, flashCell, onFinish],
  );

  const cols = useMemo(() => {
    // 100 celdas -> 10 columnas. Distintos totales -> raiz cuadrada aprox.
    const n = run.cells.length;
    return Math.round(Math.sqrt(n)) || 10;
  }, [run.cells.length]);

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* Objetivo actual */}
      <div className="flex w-full items-center justify-center gap-8 text-sm">
        <div className="flex flex-col items-center">
          <span className="text-neutral-500">Buscar</span>
          <span className="font-mono text-4xl font-bold tabular-nums">
            {status === "done" ? "✓" : (targetLabel ?? "—")}
          </span>
        </div>
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
          return (
            <button
              key={idx}
              type="button"
              disabled={status !== "running" || dimmed}
              onPointerDown={(e) => {
                e.preventDefault();
                handleCell(idx, cell.label);
              }}
              style={
                state
                  ? {
                      backgroundColor:
                        state === "ok"
                          ? "var(--ok-bg)"
                          : "var(--wrong-bg)",
                      color: "var(--feedback-text)",
                      borderColor: "transparent",
                    }
                  : dimmed
                    ? {
                        backgroundColor: "var(--background)",
                        color: "transparent",
                        borderColor: "transparent",
                      }
                    : {
                        backgroundColor: "var(--cell-bg)",
                        color: "var(--cell-text)",
                        borderColor: "var(--cell-border)",
                      }
              }
              className={[
                "flex aspect-square items-center justify-center rounded-md border font-mono font-semibold tabular-nums transition-colors",
                vs.fontClamp,
                !state && !dimmed ? vs.textOpacity : "",
                done && !dimmed ? "opacity-60" : "",
              ].join(" ")}
            >
              {cell.label}
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
        {status !== "idle" && (
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
