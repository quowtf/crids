import { isRegistrationEnabled } from "@/lib/settings";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const showRegister = await isRegistrationEnabled();
  return <LoginForm showRegister={showRegister} />;
}
