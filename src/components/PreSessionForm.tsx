"use client";

import { useState } from "react";
import type { SessionContext } from "@/lib/types";

interface Props {
  onStart: (ctx: SessionContext) => void;
  submitLabel?: string;
}

const scale = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Opciones de "hace cuánto". value = horas representativas; null = no aplicó.
const HOURS_OPTIONS: { label: string; value: number | null }[] = [
  { label: "No", value: null },
  { label: "< 1 h", value: 0.5 },
  { label: "1–3 h", value: 2 },
  { label: "3–6 h", value: 4.5 },
  { label: "> 6 h", value: 8 },
];

export default function PreSessionForm({
  onStart,
  submitLabel = "Ir al grid",
}: Props) {
  const [sleep, setSleep] = useState<string>("");
  const [fatigue, setFatigue] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  // Guardamos el indice de la opcion elegida (o null si no se toca).
  const [caffeineIdx, setCaffeineIdx] = useState<number | null>(null);
  const [exerciseIdx, setExerciseIdx] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  function submit() {
    const caffeineChoice =
      caffeineIdx == null ? null : HOURS_OPTIONS[caffeineIdx];
    const exerciseChoice =
      exerciseIdx == null ? null : HOURS_OPTIONS[exerciseIdx];

    onStart({
      sleep_hours: sleep.trim() === "" ? null : Number(sleep),
      fatigue,
      stress,
      // "No" => consumió=false, horas=null. Un rango => consumió=true, horas=valor.
      caffeine: caffeineChoice == null ? null : caffeineChoice.value !== null,
      caffeine_hours_ago: caffeineChoice?.value ?? null,
      exercised: exerciseChoice == null ? null : exerciseChoice.value !== null,
      exercise_hours_ago: exerciseChoice?.value ?? null,
      notes: notes.trim() === "" ? null : notes.trim(),
    });
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Antes de empezar</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Registra tu estado. Ayuda a interpretar tus resultados. Todo es
          opcional.
        </p>
      </div>

      {/* Sueño */}
      <label className="flex flex-col gap-1.5 text-sm">
        Horas de sueño
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={24}
          step={0.5}
          value={sleep}
          onChange={(e) => setSleep(e.target.value)}
          placeholder="ej. 7.5"
          className="rounded-md border border-[var(--cell-border)] bg-[var(--cell-bg)] px-3 py-2.5 text-base outline-none focus:border-[var(--foreground)]"
        />
      </label>

      {/* Fatiga */}
      <ScaleField
        label="Fatiga"
        hint="1 = nada cansado · 10 = agotado"
        value={fatigue}
        onChange={setFatigue}
        options={scale}
      />

      {/* Estrés */}
      <ScaleField
        label="Estrés"
        hint="1 = tranquilo · 10 = muy estresado"
        value={stress}
        onChange={setStress}
        options={scale}
      />

      {/* Cafeína */}
      <HoursField
        label="Cafeína"
        hint="¿hace cuánto tomaste café, té, energética, etc.?"
        selected={caffeineIdx}
        onChange={setCaffeineIdx}
      />

      {/* Ejercicio */}
      <HoursField
        label="Ejercicio"
        hint="¿hace cuánto hiciste ejercicio físico?"
        selected={exerciseIdx}
        onChange={setExerciseIdx}
      />

      {/* Notas */}
      <label className="flex flex-col gap-1.5 text-sm">
        Notas
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="cualquier circunstancia extraordinaria"
          className="resize-none rounded-md border border-[var(--cell-border)] bg-[var(--cell-bg)] px-3 py-2.5 text-base outline-none focus:border-[var(--foreground)]"
        />
      </label>

      <button
        type="button"
        onClick={submit}
        className="rounded-lg bg-[var(--foreground)] px-8 py-3 text-base font-medium text-[var(--background)] transition hover:opacity-85 active:opacity-75"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function ScaleField({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint: string;
  value: number | null;
  onChange: (v: number) => void;
  options: number[];
}) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span>
        {label} <span className="text-neutral-400">— {hint}</span>
      </span>
      <div className="grid grid-cols-10 gap-1">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={[
              "aspect-square rounded-md border text-xs font-medium tabular-nums transition-colors",
              value === n
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                : "border-[var(--cell-border)] hover:bg-[var(--cell-bg-hover)]",
            ].join(" ")}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function HoursField({
  label,
  hint,
  selected,
  onChange,
}: {
  label: string;
  hint: string;
  selected: number | null;
  onChange: (idx: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span>
        {label} <span className="text-neutral-400">— {hint}</span>
      </span>
      <div className="grid grid-cols-5 gap-1">
        {HOURS_OPTIONS.map((opt, idx) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(idx)}
            className={[
              "rounded-md border py-2 text-xs font-medium transition-colors",
              selected === idx
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                : "border-[var(--cell-border)] hover:bg-[var(--cell-bg-hover)]",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
