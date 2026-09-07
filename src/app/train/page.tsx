import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import TrainSession from "@/components/TrainSession";

export default async function TrainPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-dvh">
      <NavBar email={user?.email} />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-xl font-semibold">Entrenar</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Elige un juego y un modo visual, registra tu estado y empieza.
          </p>
        </div>
        <TrainSession />
      </main>
    </div>
  );
}
