"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { postFormSchema } from "@/lib/validation/crm";
import type { SocialPostStatus } from "@/types/database";
import type { FormState } from "./clients";

type ParsedPost =
  | { ok: false; error: string }
  | { ok: true; data: Partial<import("@/types/database").SocialPostRow> };

function parsePost(formData: FormData): ParsedPost {
  const parsed = postFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const d = parsed.data;

  let scheduledAt: string | null = null;
  if (d.scheduled_at) {
    const when = new Date(d.scheduled_at);
    if (Number.isNaN(when.getTime())) return { ok: false, error: "Data de publicação inválida." };
    scheduledAt = when.toISOString();
  }
  // agendar exige data; sem data fica rascunho
  const status: SocialPostStatus = d.status === "scheduled" && !scheduledAt ? "draft" : d.status;

  return {
    ok: true,
    data: {
      client_id: d.client_id,
      platform: d.platform,
      caption: d.caption || null,
      media_url: d.media_url || null,
      media_type: d.media_type === "" || d.media_type === undefined ? null : d.media_type,
      scheduled_at: scheduledAt,
      status,
    },
  };
}

export async function createPostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAgency();
  const parsed = parsePost(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("social_posts").insert(parsed.data);
  if (error) return { error: "Não foi possível salvar o post." };

  revalidatePath("/agency/posts");
  return { error: null, ok: true };
}

export async function updatePostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAgency();
  const id = formData.get("id") as string;
  if (!id) return { error: "Post inválido." };

  const parsed = parsePost(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("social_posts").update(parsed.data).eq("id", id);
  if (error) return { error: "Não foi possível salvar o post." };

  revalidatePath("/agency/posts");
  return { error: null, ok: true };
}

/** Integração de publicação: marca resultado vindo do pipeline/manual. */
export async function markPostPublishedAction(formData: FormData): Promise<void> {
  await requireAgency();
  const id = formData.get("id") as string;
  const metaPostId = ((formData.get("meta_post_id") as string) ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("social_posts")
    .update({ status: "published", meta_post_id: metaPostId || null })
    .eq("id", id);
  revalidatePath("/agency/posts");
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await requireAgency();
  const id = formData.get("id") as string;
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("social_posts").delete().eq("id", id);
  revalidatePath("/agency/posts");
}
