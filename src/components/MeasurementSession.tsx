"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Grid, { type GridRunResult } from "@/components/Grid";
import SartTest from "@/components/SartTest";
import PreSessionForm from "@/components/PreSessionForm";
import { saveResult } from "@/app/train/actions";
import { saveSartResult } from "@/app/baseline/actions";
import type { SessionContext, BaselineTest } from "@/lib/types";
import type { SartResult } from "@/lib/sart";
import {
  MEASUREMENT_GRID_TESTS,
  type MeasurementDef,
} from "@/lib/measurements";

type Phase = "form" | "grid" | "sart" | "done";
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

interface Props {
  measurement: MeasurementDef;
  /** Pruebas A/B/C ya hechas de esta medición. */
  gridDone: BaselineTest[];
  /** ¿Ya se hizo la D de esta medición? */
  sartDone: boolean;
}

/**
 * Ejecuta la SIGUIENTE parte pendiente de una medición (A, B, C o D).
 * Una parte por sesión: contexto → prueba → guardar → refrescar.
 */
export default function MeasurementSession({
  measurement,
  gridDone,
  sartDone,
}: Props) {
  const router = useRouter();

  // Determina la siguiente parte pendiente.
  const nextGrid = useMemo(
    () => MEASUREMENT_GRID_TESTS.find((t) => !gridDone.includes(t.test)) ?? null,
    [gridDone],
  );
  const doingSart = nextGrid == null && !sartDone;

  const [phase, setPhase] = useState<Phase>("form");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const contextRef = useRef<SessionContext>(emptyContext);

  const handleForm = useCallback(
    (ctx: SessionContext) => {
      contextRef.current = ctx;
      setPhase(doingSart ? "sart" : "grid");
    },
    [doingSart],
  );

  const handleGridFinish = useCallback(
    async (r: GridRunResult) => {
      if (!nextGrid) return;
      setPhase("done");
      setSaveStatus("saving");
      const res = await saveResult({
        grid_type: nextGrid.gameId,
        visual_mode: "normal",
        duration_ms: r.durationMs,
        errors: r.errors,
        targets: r.targets,
        completed_targets: r.completedTargets,
        finished_reason: r.reason,
        ab_variant: "none",
        session_mode: "transfer",
        measurement_index: measurement.index,
        baseline_test: nextGrid.test,
        ...contextRef.current,
      });
      setSaveStatus(res.ok ? "saved" : "error");
      if (!res.ok) setSaveError(res.error ?? "Error al guardar.");
    },
    [nextGrid, measurement.index],
  );

  const handleSartFinish = useCallback(
    async (r: SartResult) => {
      setPhase("done");
      setSaveStatus("saving");
      const res = await saveSartResult({
        session_mode: "transfer",
        measurement_index: measurement.index,
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
      setSaveStatus(res.ok ? "saved" : "error");
      if (!res.ok) setSaveError(res.error ?? "Error al guardar.");
    },
    [measurement.index],
  );

  const cont = useCallback(() => {
    router.refresh();
  }, [router]);

  const partName = doingSart
    ? "Prueba D — atención sostenida"
    : (nextGrid?.name ?? "");

  if (phase === "form") {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="rounded-lg border border-[var(--cell-border)] p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            {measurement.name}
          </div>
          <div className="mt-1 text-sm font-medium">{partName}</div>
        </div>
        <PreSessionForm onStart={handleForm} submitLabel="Ir a la prueba" />
      </div>
    );
  }

  if (phase === "grid" && nextGrid) {
    return (
      <div className="flex justify-center">
        <Grid
          gameId={nextGrid.gameId}
          visual="normal"
          dimFound
          showStats={false}
          onFinish={handleGridFinish}
        />
      </div>
    );
  }

  if (phase === "sart") {
    return (
      <div className="flex justify-center">
        <SartTest onFinish={handleSartFinish} />
      </div>
    );
  }

  // done
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-lg border border-[var(--cell-border)] p-4 text-center text-sm">
      {saveStatus === "saving" && (
        <span className="text-neutral-500">Guardando…</span>
      )}
      {saveStatus === "saved" && (
        <span style={{ color: "var(--ok-bg)" }}>Prueba registrada.</span>
      )}
      {saveStatus === "error" && (
        <span style={{ color: "var(--wrong-bg)" }}>{saveError}</span>
      )}
      {saveStatus === "saved" && (
        <button
          type="button"
          onClick={cont}
          className="rounded-lg bg-[var(--foreground)] px-6 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-85"
        >
          Continuar
        </button>
      )}
    </div>
  );
}
