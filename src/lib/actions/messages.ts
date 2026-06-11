"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext, isAgency } from "@/lib/auth";
import { messageSchema } from "@/lib/validation/crm";

export interface SendMessageState {
  error: string | null;
  ok?: boolean;
}

/** Chat agência ⇄ cliente. RLS reforça; aqui definimos o lado do remetente. */
export async function sendMessageAction(_prev: SendMessageState, formData: FormData): Promise<SendMessageState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Sessão expirada." };

  const parsed = messageSchema.safeParse({
    client_id: formData.get("client_id"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Mensagem inválida." };

  const agency = isAgency(ctx.appUser);
  if (!agency && ctx.appUser.client_id !== parsed.data.client_id) {
    return { error: "Sem acesso a essa conversa." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("client_messages").insert({
    client_id: parsed.data.client_id,
    sender_id: ctx.appUser.id,
    sender_type: agency ? "agency" : "client",
    body: parsed.data.body,
  });
  if (error) return { error: "Não foi possível enviar." };

  revalidatePath("/agency/inbox");
  revalidatePath("/client/messages");
  return { error: null, ok: true };
}

/** Marca como lidas as mensagens recebidas (lado oposto) da conversa. */
export async function markThreadReadAction(clientId: string): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx || !clientId) return;

  const agency = isAgency(ctx.appUser);
  if (!agency && ctx.appUser.client_id !== clientId) return;

  const supabase = await createClient();
  await supabase
    .from("client_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("client_id", clientId)
    .eq("sender_type", agency ? "client" : "agency")
    .is("read_at", null);
}

/** Marca notificações do cliente como lidas. */
export async function markNotificationsReadAction(): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx?.appUser.client_id) return;

  const supabase = await createClient();
  await supabase
    .from("client_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("client_id", ctx.appUser.client_id)
    .is("read_at", null);
  revalidatePath("/client/dashboard");
}
