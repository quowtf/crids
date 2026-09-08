"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Grid, { type GridRunResult } from "@/components/Grid";
import PreSessionForm from "@/components/PreSessionForm";
import { saveResult } from "@/app/train/actions";
import type { SessionContext } from "@/lib/types";
import type { ProtocolStep } from "@/lib/protocol";

type Phase = "intro" | "form" | "grid" | "done";
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

/**
 * Ejecuta UN paso del protocolo. A diferencia del modo libre:
 *  - no hay selector de juego (viene fijado por el paso)
 *  - el formulario de contexto siempre se muestra al inicio (es un experimento)
 *  - se guarda con mode="protocol" y el protocol_step correspondiente
 */
export default function ProtocolSession({ step }: { step: ProtocolStep }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const contextRef = useRef<SessionContext>(emptyContext);
  const [sessionKey, setSessionKey] = useState(0);

  const handleForm = useCallback((ctx: SessionContext) => {
    contextRef.current = ctx;
    setPhase("grid");
  }, []);

  const handleFinish = useCallback(
    async (r: GridRunResult) => {
      setPhase("done");
      setSaveStatus("saving");
      setSaveError(null);

      const res = await saveResult({
        grid_type: step.gameId,
        visual_mode: step.visual,
        duration_ms: r.durationMs,
        errors: r.errors,
        targets: r.targets,
        completed_targets: r.completedTargets,
        finished_reason: r.reason,
        ab_variant: "none", // el protocolo no participa del A/B de form_timing
        session_mode: "protocol",
        protocol_step: step.index,
        ...contextRef.current,
      });

      if (res.ok) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
        setSaveError(res.error ?? "Error al guardar.");
      }
    },
    [step],
  );

  // Refresca la página del servidor para recalcular el progreso.
  const nextStep = useCallback(() => {
    router.refresh();
    contextRef.current = emptyContext;
    setSaveStatus("idle");
    setSaveError(null);
    setSessionKey((k) => k + 1);
    setPhase("intro");
  }, [router]);

  if (phase === "intro") {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="rounded-lg border border-[var(--cell-border)] p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Semana {step.week} · {step.block}
          </div>
          <div className="mt-1 text-lg font-semibold">{step.label}</div>
        </div>
        <button
          type="button"
          onClick={() => setPhase("form")}
          className="rounded-lg bg-[var(--foreground)] px-8 py-3 text-base font-medium text-[var(--background)] transition hover:opacity-85 active:opacity-75"
        >
          Empezar este ejercicio
        </button>
      </div>
    );
  }

  if (phase === "form") {
    return (
      <div className="flex flex-col items-center">
        <PreSessionForm onStart={handleForm} submitLabel="Ir al grid" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <Grid
        key={`${step.index}-${sessionKey}`}
        gameId={step.gameId}
        visual={step.visual}
        dimFound={step.dimFound}
        showStats={false}
        onFinish={handleFinish}
      />

      {phase === "done" && (
        <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-lg border border-[var(--cell-border)] p-4 text-center text-sm">
          {saveStatus === "saving" && (
            <span className="text-neutral-500">Guardando…</span>
          )}
          {saveStatus === "saved" && (
            <span style={{ color: "var(--ok-bg)" }}>
              Ejercicio del protocolo completado.
            </span>
          )}
          {saveStatus === "error" && (
            <span style={{ color: "var(--wrong-bg)" }}>{saveError}</span>
          )}
          {saveStatus === "saved" && (
            <button
              type="button"
              onClick={nextStep}
              className="rounded-lg bg-[var(--foreground)] px-6 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-85"
            >
              Continuar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
