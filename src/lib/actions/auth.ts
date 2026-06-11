"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext, homePathFor } from "@/lib/auth";
import { loginSchema, safeInternalPath, setPasswordSchema } from "@/lib/validation/auth";

export interface AuthFormState {
  error: string | null;
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "E-mail ou senha incorretos." };
  }

  const ctx = await getSessionContext();
  if (!ctx) {
    await supabase.auth.signOut();
    return { error: "Sua conta ainda não tem perfil de acesso. Fale com a agência." };
  }

  redirect(safeInternalPath(formData.get("next") as string | null, homePathFor(ctx)));
}

export async function signInWithGoogleAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const next = safeInternalPath(formData.get("next") as string | null, "/");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${site}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function setPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = setPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Não foi possível definir a senha. Tente novamente." };

  const ctx = await getSessionContext();
  redirect(ctx ? homePathFor(ctx) : "/login");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
