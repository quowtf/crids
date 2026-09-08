import { createClient } from "@/lib/supabase/server";

/**
 * Lee un flag booleano de app_settings.
 * Si la tabla o la clave no existen, devuelve el valor por defecto.
 */
export async function getBooleanSetting(
  key: string,
  fallback: boolean,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error || !data) return fallback;
  return data.value === "true";
}

/** ¿Está habilitado el registro público de usuarios? */
export async function isRegistrationEnabled(): Promise<boolean> {
  // Por defecto habilitado si no hay flag configurado.
  return getBooleanSetting("registration_enabled", true);
}
