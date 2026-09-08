"use server";

import { createClient } from "@/lib/supabase/server";
import type { NewSartResult } from "@/lib/sart";

export interface SaveState {
  ok?: boolean;
  error?: string;
}

/** Guarda un resultado de la prueba de atención sostenida (SART). */
export async function saveSartResult(
  result: NewSartResult,
): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No hay sesión activa." };

  const { error } = await supabase.from("attention_tests").insert({
    user_id: user.id,
    session_mode: result.session_mode,
    measurement_index: result.measurement_index ?? null,
    duration_ms: result.duration_ms,
    target_digit: result.target_digit,
    total_stimuli: result.total_stimuli,
    go_total: result.go_total,
    nogo_total: result.nogo_total,
    omissions: result.omissions,
    commissions: result.commissions,
    correct_go: result.correct_go,
    mean_rt_ms: result.mean_rt_ms,
    rt_sd_ms: result.rt_sd_ms,
    sleep_hours: result.sleep_hours ?? null,
    fatigue: result.fatigue ?? null,
    stress: result.stress ?? null,
    caffeine: result.caffeine ?? null,
    caffeine_hours_ago: result.caffeine_hours_ago ?? null,
    exercised: result.exercised ?? null,
    exercise_hours_ago: result.exercise_hours_ago ?? null,
    notes: result.notes ?? null,
  });

  if (error) return { error: error.message };
  return { ok: true };
}
