import { redirect } from "next/navigation";

// Registro publico deshabilitado por ahora (free tier sin envio de correos).
// Los usuarios se crean con scripts/create-user.mjs.
export default function RegisterPage() {
  redirect("/login");
}
