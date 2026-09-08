"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  nextDigit,
  rtStats,
  SART_DURATION_MS,
  SART_STIMULUS_MS,
  SART_TARGET_DIGIT,
  type SartResult,
} from "@/lib/sart";
import { formatDuration } from "@/lib/grid";

type Status = "idle" | "running" | "done";

interface Props {
  onFinish: (r: SartResult) => void;
}

export default function SartTest({ onFinish }: Props) {
  const target = SART_TARGET_DIGIT;
  const [status, setStatus] = useState<Status>("idle");
  const [digit, setDigit] = useState<number | null>(null);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [remaining, setRemaining] = useState(SART_DURATION_MS);

  // Acumuladores en refs (los timers no ven el estado de React).
  const startRef = useRef(0);
  const stimShownRef = useRef(0); // cuándo apareció el estímulo actual
  const respondedRef = useRef(false); // ¿ya respondió al estímulo actual?
  const isNogoRef = useRef(false); // ¿el estímulo actual es objetivo?
  const stimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const acc = useRef({
    total: 0,
    go: 0,
    nogo: 0,
    omissions: 0,
    commissions: 0,
    correctGo: 0,
    rts: [] as number[],
  });

  const finish = useCallback(() => {
    if (stimTimerRef.current) clearTimeout(stimTimerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    const a = acc.current;
    const { mean, sd } = rtStats(a.rts);
    setStatus("done");
    setDigit(null);
    onFinish({
      durationMs: Date.now() - startRef.current,
      targetDigit: target,
      totalStimuli: a.total,
      goTotal: a.go,
      nogoTotal: a.nogo,
      omissions: a.omissions,
      commissions: a.commissions,
      correctGo: a.correctGo,
      meanRtMs: mean == null ? null : Math.round(mean),
      rtSdMs: sd == null ? null : Math.round(sd),
    });
  }, [onFinish, target]);

  // Cierra el estímulo anterior (registra omisión si era go y no respondió).
  const closePreviousStimulus = useCallback(() => {
    const a = acc.current;
    if (a.total === 0) return;
    if (!isNogoRef.current && !respondedRef.current) {
      a.omissions += 1; // era go y no respondió
    }
  }, []);

  // Ref al propio loop para poder auto-reprogramarse sin recursión en deps.
  const showNextRef = useRef<() => void>(() => {});

  const showNextStimulus = useCallback(() => {
    if (Date.now() - startRef.current >= SART_DURATION_MS) {
      closePreviousStimulus();
      finish();
      return;
    }
    closePreviousStimulus();

    const d = nextDigit(target);
    const isNogo = d === target;
    isNogoRef.current = isNogo;
    respondedRef.current = false;
    stimShownRef.current = Date.now();

    const a = acc.current;
    a.total += 1;
    if (isNogo) a.nogo += 1;
    else a.go += 1;

    setDigit(d);
    setFlash(null);

    stimTimerRef.current = setTimeout(
      () => showNextRef.current(),
      SART_STIMULUS_MS,
    );
  }, [target, closePreviousStimulus, finish]);

  // Mantener la ref apuntando al callback más reciente.
  useEffect(() => {
    showNextRef.current = showNextStimulus;
  }, [showNextStimulus]);

  const start = useCallback(() => {
    acc.current = {
      total: 0,
      go: 0,
      nogo: 0,
      omissions: 0,
      commissions: 0,
      correctGo: 0,
      rts: [],
    };
    startRef.current = Date.now();
    setStatus("running");
    setRemaining(SART_DURATION_MS);
    tickRef.current = setInterval(() => {
      setRemaining(
        Math.max(0, SART_DURATION_MS - (Date.now() - startRef.current)),
      );
    }, 250);
    showNextStimulus();
  }, [showNextStimulus]);

  const respond = useCallback(() => {
    if (status !== "running" || digit == null || respondedRef.current) return;
    respondedRef.current = true;
    const a = acc.current;
    if (isNogoRef.current) {
      // Respondió a un no-go: falla de inhibición.
      a.commissions += 1;
      setFlash("bad");
    } else {
      a.correctGo += 1;
      a.rts.push(Date.now() - stimShownRef.current);
      setFlash("ok");
    }
  }, [status, digit]);

  // Responder con barra espaciadora además del tap.
  useEffect(() => {
    if (status !== "running") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        respond();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, respond]);

  // Limpieza al desmontar.
  useEffect(() => {
    return () => {
      if (stimTimerRef.current) clearTimeout(stimTimerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  if (status === "idle") {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="rounded-lg border border-[var(--cell-border)] p-4 text-sm">
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Prueba D — Atención sostenida
          </div>
          <p className="mt-2">
            Aparecerán dígitos del 0 al 9, uno a uno. Toca (o pulsa espacio) en{" "}
            <strong>todos</strong> los dígitos, <strong>excepto</strong> cuando
            aparezca el <strong>{target}</strong>: en ese caso no hagas nada.
          </p>
          <p className="mt-2 text-neutral-500">Dura unos 3 minutos.</p>
        </div>
        <button
          type="button"
          onClick={start}
          className="rounded-lg bg-[var(--foreground)] px-8 py-3 text-base font-medium text-[var(--background)] transition hover:opacity-85 active:opacity-75"
        >
          Empezar
        </button>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="text-center text-sm text-neutral-500">
        Prueba terminada.
      </div>
    );
  }

  // running
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <div className="text-sm text-neutral-500">
        No toques el <strong>{target}</strong> · {formatDuration(remaining)}
      </div>

      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          respond();
        }}
        className="flex aspect-square w-full max-w-xs items-center justify-center rounded-2xl border transition-colors"
        style={{
          backgroundColor:
            flash === "ok"
              ? "var(--ok-bg)"
              : flash === "bad"
                ? "var(--wrong-bg)"
                : "var(--cell-bg)",
          borderColor: "var(--cell-border)",
          color:
            flash === "ok" || flash === "bad"
              ? "var(--feedback-text)"
              : "var(--cell-text)",
        }}
      >
        <span className="font-mono text-[8rem] font-bold tabular-nums">
          {digit ?? ""}
        </span>
      </button>

      <p className="text-xs text-neutral-500">
        Toca la tarjeta (o pulsa espacio) para responder.
      </p>
    </div>
  );
}
