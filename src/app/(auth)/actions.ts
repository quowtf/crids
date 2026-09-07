"use server";

import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  message?: string;
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Registro con email + password. Dispara email de confirmacion. */
export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();

  if (!email || !password) {
    return { error: "Correo y contraseña son obligatorios." };
  }
  // Validacion de formato de correo.
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return { error: "Introduce una dirección de correo válida." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: username || null },
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {
    message:
      "Te enviamos un correo de confirmación. Abre el enlace para activar tu cuenta antes de iniciar sesión.",
  };
}

/** Login con email + password. */
export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Correo y contraseña son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Mensaje claro cuando el correo aun no fue confirmado.
    if (error.message.toLowerCase().includes("not confirmed")) {
      return {
        error:
          "Tu correo aún no está confirmado. Revisa tu bandeja y abre el enlace de activación.",
      };
    }
    return { error: "Correo o contraseña incorrectos." };
  }

  return { message: "ok" };
}
