"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Grid, { type GridRunResult } from "@/components/Grid";
import PreSessionForm from "@/components/PreSessionForm";
import { saveResult } from "@/app/train/actions";
import type { SessionContext } from "@/lib/types";
import type { BaselineStep } from "@/lib/baseline";

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

/** Ejecuta UN intento de una prueba de línea base. */
export default function BaselineSession({ step }: { step: BaselineStep }) {
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
        grid_type: step.def.gameId,
        visual_mode: "normal",
        duration_ms: r.durationMs,
        errors: r.errors,
        targets: r.targets,
        completed_targets: r.completedTargets,
        finished_reason: r.reason,
        ab_variant: "none",
        session_mode: "baseline",
        baseline_test: step.test,
        baseline_attempt: step.attempt,
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

  const next = useCallback(() => {
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
            {step.def.name} · intento {step.attempt}/2
          </div>
          <div className="mt-1 text-sm text-neutral-500">
            {step.def.description}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPhase("form")}
          className="rounded-lg bg-[var(--foreground)] px-8 py-3 text-base font-medium text-[var(--background)] transition hover:opacity-85 active:opacity-75"
        >
          Empezar prueba
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
        gameId={step.def.gameId}
        visual="normal"
        dimFound
        showStats={false}
        onFinish={handleFinish}
      />

      {phase === "done" && (
        <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-lg border border-[var(--cell-border)] p-4 text-center text-sm">
          {saveStatus === "saving" && (
            <span className="text-neutral-500">Guardando…</span>
          )}
          {saveStatus === "saved" && (
            <span style={{ color: "var(--ok-bg)" }}>Intento registrado.</span>
          )}
          {saveStatus === "error" && (
            <span style={{ color: "var(--wrong-bg)" }}>{saveError}</span>
          )}
          {saveStatus === "saved" && (
            <button
              type="button"
              onClick={next}
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
