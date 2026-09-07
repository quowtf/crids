import type { GameId } from "./games";
import type { VisualMode } from "./visual";
import type { FormTiming, FinishReason } from "./experiment";

/** El tipo de grid guardado corresponde al id del juego. */
export type GridType = GameId;

/** Contexto pre-prueba: estado del usuario antes de la sesion. */
export interface SessionContext {
  sleep_hours: number | null;
  fatigue: number | null; // 1-10
  stress: number | null; // 1-10
  caffeine: boolean | null; // ¿consumió cafeína?
  caffeine_hours_ago: number | null; // horas desde la última cafeína
  exercised: boolean | null; // ¿hizo ejercicio?
  exercise_hours_ago: number | null; // horas desde el ejercicio
  notes: string | null;
}

/** Resultado de una sesion de grid, tal como se guarda en Supabase. */
export interface GridResult extends SessionContext {
  id: string;
  user_id: string;
  grid_type: GridType;
  visual_mode: VisualMode | null;
  duration_ms: number;
  errors: number;
  targets: number; // cuantos objetivos tenia el grid
  completed_targets: number | null; // cuantos se acertaron
  ab_variant: FormTiming | null;
  finished_reason: FinishReason | null;
  created_at: string;
}

/** Datos para insertar un resultado nuevo. */
export interface NewGridResult extends Partial<SessionContext> {
  grid_type: GridType;
  visual_mode: VisualMode;
  duration_ms: number;
  errors: number;
  targets: number;
  completed_targets: number;
  ab_variant: FormTiming;
  finished_reason: FinishReason;
}
