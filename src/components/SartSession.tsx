"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SartTest from "@/components/SartTest";
import PreSessionForm from "@/components/PreSessionForm";
import { saveSartResult } from "@/app/baseline/actions";
import type { SessionContext } from "@/lib/types";
import type { SartResult } from "@/lib/sart";

type Phase = "intro" | "form" | "test" | "done";
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

/** Orquesta la Prueba D dentro de la línea base: contexto → SART → guardar. */
export default function SartSession() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const contextRef = useRef<SessionContext>(emptyContext);

  const handleForm = useCallback((ctx: SessionContext) => {
    contextRef.current = ctx;
    setPhase("test");
  }, []);

  const handleFinish = useCallback(async (r: SartResult) => {
    setPhase("done");
    setSaveStatus("saving");
    setSaveError(null);

    const res = await saveSartResult({
      session_mode: "baseline",
      duration_ms: r.durationMs,
      target_digit: r.targetDigit,
      total_stimuli: r.totalStimuli,
      go_total: r.goTotal,
      nogo_total: r.nogoTotal,
      omissions: r.omissions,
      commissions: r.commissions,
      correct_go: r.correctGo,
      mean_rt_ms: r.meanRtMs,
      rt_sd_ms: r.rtSdMs,
      ...contextRef.current,
    });

    if (res.ok) setSaveStatus("saved");
    else {
      setSaveStatus("error");
      setSaveError(res.error ?? "Error al guardar.");
    }
  }, []);

  const done = useCallback(() => {
    router.refresh();
  }, [router]);

  if (phase === "intro") {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="rounded-lg border border-[var(--cell-border)] p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Prueba D · atención sostenida
          </div>
          <div className="mt-1 text-sm text-neutral-500">
            Una tarea distinta de las cuadrículas: mide si mantienes la atención
            varios minutos. Un solo intento.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPhase("form")}
          className="rounded-lg bg-[var(--foreground)] px-8 py-3 text-base font-medium text-[var(--background)] transition hover:opacity-85 active:opacity-75"
        >
          Empezar prueba D
        </button>
      </div>
    );
  }

  if (phase === "form") {
    return (
      <div className="flex flex-col items-center">
        <PreSessionForm onStart={handleForm} submitLabel="Ir a la prueba" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <SartTest onFinish={handleFinish} />

      {phase === "done" && (
        <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-lg border border-[var(--cell-border)] p-4 text-center text-sm">
          {saveStatus === "saving" && (
            <span className="text-neutral-500">Guardando…</span>
          )}
          {saveStatus === "saved" && (
            <span style={{ color: "var(--ok-bg)" }}>Prueba D registrada.</span>
          )}
          {saveStatus === "error" && (
            <span style={{ color: "var(--wrong-bg)" }}>{saveError}</span>
          )}
          {saveStatus === "saved" && (
            <button
              type="button"
              onClick={done}
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
