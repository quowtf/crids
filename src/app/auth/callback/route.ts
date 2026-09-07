import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback de confirmacion de email.
 * Supabase redirige aqui con un `code` tras hacer clic en el enlace del correo.
 * Intercambiamos el code por una sesion y enviamos al usuario a /train.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/train";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Sin code o error: manda a login con aviso.
  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
