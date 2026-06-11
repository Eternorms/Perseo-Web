"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { taskFormSchema } from "@/lib/validation/crm";
import type { TaskStatus } from "@/types/database";
import type { FormState } from "./clients";

const TASK_STATUSES: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "done"];

export async function createTaskAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { appUser } = await requireAgency();
  const parsed = taskFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const d = parsed.data;

  // entra no fim da coluna
  const { data: last } = await supabase
    .from("tasks")
    .select("position")
    .eq("status", d.status)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("tasks").insert({
    title: d.title,
    description: d.description || null,
    status: d.status,
    priority: d.priority,
    client_id: d.client_id || null,
    assigned_to: d.assigned_to || null,
    created_by: appUser.id,
    due_date: d.due_date || null,
    position: (last?.position ?? 0) + 1024,
  });
  if (error) return { error: "Não foi possível criar a tarefa." };

  revalidatePath("/agency/kanban");
  return { error: null, ok: true };
}

export async function updateTaskAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAgency();
  const id = formData.get("id") as string;
  if (!id) return { error: "Tarefa inválida." };

  const parsed = taskFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const d = parsed.data;
  const { error } = await supabase
    .from("tasks")
    .update({
      title: d.title,
      description: d.description || null,
      status: d.status,
      priority: d.priority,
      client_id: d.client_id || null,
      assigned_to: d.assigned_to || null,
      due_date: d.due_date || null,
    })
    .eq("id", id);
  if (error) return { error: "Não foi possível salvar a tarefa." };

  revalidatePath("/agency/kanban");
  return { error: null, ok: true };
}

/** Drag-and-drop: nova coluna + posição relativa (entre prev e next). */
export async function moveTaskAction(input: {
  id: string;
  status: TaskStatus;
  beforePosition: number | null;
  afterPosition: number | null;
}): Promise<void> {
  await requireAgency();
  if (!TASK_STATUSES.includes(input.status)) return;

  const { beforePosition, afterPosition } = input;
  let position: number;
  if (beforePosition != null && afterPosition != null) position = (beforePosition + afterPosition) / 2;
  else if (afterPosition != null) position = afterPosition - 1024;
  else if (beforePosition != null) position = beforePosition + 1024;
  else position = 1024;

  const supabase = await createClient();
  await supabase.from("tasks").update({ status: input.status, position }).eq("id", input.id);
  revalidatePath("/agency/kanban");
}

export async function deleteTaskAction(formData: FormData): Promise<void> {
  await requireAgency();
  const id = formData.get("id") as string;
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/agency/kanban");
}
