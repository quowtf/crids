"use client";

import { useState } from "react";
import { GAMES, type GameId } from "@/lib/games";
import { VISUAL_LABELS, type VisualMode } from "@/lib/visual";

export interface SetupChoice {
  gameId: GameId;
  visual: VisualMode;
  dimFound: boolean;
}

interface Props {
  onConfirm: (choice: SetupChoice) => void;
}

export default function GameSetup({ onConfirm }: Props) {
  const [gameId, setGameId] = useState<GameId>("L1");
  const [visual, setVisual] = useState<VisualMode>("normal");
  const [dimFound, setDimFound] = useState(true);

  const visualModes: VisualMode[] = ["normal", "load"];

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Modo libre</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Elige el juego y cómo quieres jugarlo.
        </p>
      </div>

      {/* Juego */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Juego</span>
        <div className="flex flex-col gap-2">
          {GAMES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGameId(g.id)}
              className={[
                "rounded-lg border p-3 text-left transition-colors",
                gameId === g.id
                  ? "border-[var(--foreground)] bg-[var(--cell-bg-hover)]"
                  : "border-[var(--cell-border)] hover:bg-[var(--cell-bg-hover)]",
              ].join(" ")}
            >
              <div className="text-sm font-medium">{g.name}</div>
              <div className="mt-0.5 text-xs text-neutral-500">
                {g.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modo visual */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Modo visual</span>
        <div className="flex gap-2">
          {visualModes.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setVisual(m)}
              className={[
                "flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors",
                visual === m
                  ? "border-[var(--foreground)] bg-[var(--cell-bg-hover)]"
                  : "border-[var(--cell-border)] hover:bg-[var(--cell-bg-hover)]",
              ].join(" ")}
            >
              {VISUAL_LABELS[m]}
            </button>
          ))}
        </div>
        <p className="text-xs text-neutral-500">
          Carga visual: números algo más pequeños y juntos. No busca poner a
          prueba tu vista, sino tu atención.
        </p>
      </div>

      {/* Apagar acertadas */}
      <label className="flex items-center justify-between gap-3 rounded-lg border border-[var(--cell-border)] p-3 text-sm">
        <span>
          Apagar celdas acertadas
          <span className="mt-0.5 block text-xs text-neutral-500">
            Las que ya encontraste se ocultan.
          </span>
        </span>
        <input
          type="checkbox"
          checked={dimFound}
          onChange={(e) => setDimFound(e.target.checked)}
          className="h-5 w-5 accent-[var(--foreground)]"
        />
      </label>

      <button
        type="button"
        onClick={() => onConfirm({ gameId, visual, dimFound })}
        className="rounded-lg bg-[var(--foreground)] px-8 py-3 text-base font-medium text-[var(--background)] transition hover:opacity-85 active:opacity-75"
      >
        Continuar
      </button>
    </div>
  );
}
