import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/brand/logo";
import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = { title: "Definir senha" };

export default async function SetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm animate-rise">
        <Logo className="mb-8" />
        <h1 className="text-xl font-semibold tracking-tight">Defina sua senha</h1>
        <p className="mt-1 text-sm text-ink-mute">
          Bem-vindo à Perseo, <span className="text-ink">{user.email}</span>. Crie uma senha para os próximos acessos.
        </p>
        <SetPasswordForm />
      </div>
    </main>
  );
}
