"use server";

import { createClient } from "@/lib/supabase/server";
import type { NewGridResult } from "@/lib/types";

export interface SaveState {
  ok?: boolean;
  error?: string;
}

/** Guarda un resultado de grid del usuario autenticado. */
export async function saveResult(result: NewGridResult): Promise<SaveState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No hay sesión activa." };
  }

  const { error } = await supabase.from("grid_results").insert({
    user_id: user.id,
    grid_type: result.grid_type,
    visual_mode: result.visual_mode,
    duration_ms: result.duration_ms,
    errors: result.errors,
    targets: result.targets,
    completed_targets: result.completed_targets,
    ab_variant: result.ab_variant,
    finished_reason: result.finished_reason,
    sleep_hours: result.sleep_hours ?? null,
    fatigue: result.fatigue ?? null,
    stress: result.stress ?? null,
    caffeine: result.caffeine ?? null,
    caffeine_hours_ago: result.caffeine_hours_ago ?? null,
    exercised: result.exercised ?? null,
    exercise_hours_ago: result.exercise_hours_ago ?? null,
    notes: result.notes ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}
