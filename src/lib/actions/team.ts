"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/auth";
import { inviteUserSchema } from "@/lib/validation/crm";
import type { FormState } from "./clients";

/**
 * Convite via Supabase Auth admin (service role). Cria auth.users +
 * app_users com papel/vínculo. E-mail de convite leva a /auth/callback
 * → definir senha.
 */
export async function inviteUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();

  const parsed = inviteUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { email, name, user_type, client_id } = parsed.data;
  const isClientUser = user_type === "client_owner" || user_type === "client_staff";
  if (isClientUser && !client_id) return { error: "Selecione o cliente do usuário." };

  const admin = createAdminClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name },
    redirectTo: `${site}/auth/callback`,
  });
  if (error || !data.user) {
    return { error: error?.message.includes("already") ? "Esse e-mail já tem conta." : "Falha ao enviar o convite." };
  }

  const { error: linkError } = await admin.from("app_users").insert({
    supabase_uid: data.user.id,
    user_type,
    client_id: isClientUser ? client_id : null,
    name,
    email,
  });
  if (linkError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "Falha ao vincular o usuário. Convite cancelado." };
  }

  revalidatePath("/agency/team");
  return { error: null, ok: true };
}

/** Remove acesso (app_users + auth.users). Owner não remove a si mesmo. */
export async function removeUserAction(formData: FormData): Promise<void> {
  const { appUser } = await requireOwner();
  const id = formData.get("id") as string;
  if (!id || id === appUser.id) return;

  const supabase = await createClient();
  const { data: target } = await supabase.from("app_users").select("supabase_uid").eq("id", id).maybeSingle();
  if (!target) return;

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(target.supabase_uid); // cascade apaga app_users

  revalidatePath("/agency/team");
}
