"use client";

import { useCallback, useRef, useState } from "react";
import Grid, { type GridRunResult } from "@/components/Grid";
import PreSessionForm from "@/components/PreSessionForm";
import GameSetup, { type SetupChoice } from "@/components/GameSetup";
import { saveResult } from "@/app/train/actions";
import type { SessionContext } from "@/lib/types";
import { assignFormTiming, type FormTiming } from "@/lib/experiment";

/**
 * Fases posibles:
 *  - setup:     elegir juego + modo visual
 *  - formStart: formulario ANTES del grid (variante "start")
 *  - grid:      jugando
 *  - formEnd:   formulario DESPUÉS del grid (variante "end")
 *  - done:      resultado guardado
 *
 * El formulario se muestra en UN solo momento según la variante A/B:
 *  - "start" -> formStart antes del grid
 *  - "end"   -> formEnd tras el grid
 *  - "none"  -> nunca
 */
type Phase = "setup" | "formStart" | "grid" | "formEnd" | "done";
type SaveStatus = "idle" | "saving" | "saved" | "error";

const emptyContext: SessionContext = {
  sleep_hours: null,
  fatigue: null,
  stress: null,
  caffeine: null,
  caffeine_hours_ago: null,
  exercised: null,
  exercise_hours_ago: null,
  notes: null,
};

export default function TrainSession() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [choice, setChoice] = useState<SetupChoice | null>(null);
  const [variant, setVariant] = useState<FormTiming>("none");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Clave para remontar el Grid en cada sesión nueva.
  const [sessionKey, setSessionKey] = useState(0);

  // Contexto y resultado del grid se guardan en refs hasta tener ambos.
  const contextRef = useRef<SessionContext>(emptyContext);
  const resultRef = useRef<GridRunResult | null>(null);

  const persist = useCallback(async () => {
    if (!choice || !resultRef.current) return;
    setSaveStatus("saving");
    setSaveError(null);

    const r = resultRef.current;
    const res = await saveResult({
      grid_type: choice.gameId,
      visual_mode: choice.visual,
      duration_ms: r.durationMs,
      errors: r.errors,
      targets: r.targets,
      completed_targets: r.completedTargets,
      finished_reason: r.reason,
      ab_variant: variant,
      session_mode: "free",
      ...contextRef.current,
    });

    setSaveStatus(res.ok ? "saved" : "error");
    if (!res.ok) setSaveError(res.error ?? "Error al guardar.");
  }, [choice, variant]);

  // --- transiciones ---

  const handleSetup = useCallback((c: SetupChoice) => {
    setChoice(c);
    const v = assignFormTiming();
    setVariant(v);
    contextRef.current = emptyContext;
    resultRef.current = null;
    setPhase(v === "start" ? "formStart" : "grid");
  }, []);

  // Formulario al inicio -> guarda contexto y arranca el grid.
  const handleFormStart = useCallback((ctx: SessionContext) => {
    contextRef.current = ctx;
    setPhase("grid");
  }, []);

  // El grid terminó (completado o manual).
  const handleGridFinish = useCallback(
    (result: GridRunResult) => {
      resultRef.current = result;
      if (variant === "end") {
        setPhase("formEnd");
      } else {
        // "start" (ya se llenó) o "none" (nunca): guardar directo.
        setPhase("done");
        void persist();
      }
    },
    [variant, persist],
  );

  // Formulario al final -> guarda contexto y persiste.
  const handleFormEnd = useCallback(
    (ctx: SessionContext) => {
      contextRef.current = ctx;
      setPhase("done");
      void persist();
    },
    [persist],
  );

  const backToSetup = useCallback(() => {
    setChoice(null);
    setVariant("none");
    contextRef.current = emptyContext;
    resultRef.current = null;
    setSaveStatus("idle");
    setSaveError(null);
    setSessionKey((k) => k + 1);
    setPhase("setup");
  }, []);

  // --- render por fase ---

  if (phase === "setup") {
    return <GameSetup onConfirm={handleSetup} />;
  }

  if (phase === "formStart") {
    return (
      <div className="flex flex-col items-center">
        <PreSessionForm onStart={handleFormStart} submitLabel="Ir al grid" />
      </div>
    );
  }

  if (phase === "formEnd") {
    return (
      <div className="flex flex-col items-center">
        <PreSessionForm onStart={handleFormEnd} submitLabel="Guardar sesión" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {choice && (
        <Grid
          key={`${choice.gameId}-${sessionKey}`}
          gameId={choice.gameId}
          visual={choice.visual}
          dimFound={choice.dimFound}
          showStats={false}
          onFinish={handleGridFinish}
        />
      )}

      {phase === "done" && (
        <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-lg border border-[var(--cell-border)] p-4 text-center text-sm">
          {saveStatus === "saving" && (
            <span className="text-neutral-500">Guardando…</span>
          )}
          {saveStatus === "saved" && (
            <span style={{ color: "var(--ok-bg)" }}>
              Sesión completada y guardada.
            </span>
          )}
          {saveStatus === "error" && (
            <span style={{ color: "var(--wrong-bg)" }}>{saveError}</span>
          )}
          <button
            type="button"
            onClick={backToSetup}
            className="rounded-lg border border-[var(--cell-border)] px-6 py-2.5 text-sm font-medium transition hover:bg-[var(--cell-bg-hover)]"
          >
            Elegir otro juego
          </button>
        </div>
      )}
    </div>
  );
}
