import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { PageHeader } from "@/components/kit/page-header";
import { KanbanBoard } from "@/components/agency/kanban-board";

export const metadata: Metadata = { title: "Kanban" };

export default async function KanbanPage() {
  await requireAgency();
  const supabase = await createClient();

  const [tasksQ, clientsQ, usersQ] = await Promise.all([
    supabase.from("tasks").select("*").order("position", { ascending: true }),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("app_users").select("id, name").in("user_type", ["agency_owner", "agency_staff"]).order("name"),
  ]);

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Kanban" subtitle="Tarefas da operação — arraste para mover de etapa." />
      <KanbanBoard
        tasks={tasksQ.data ?? []}
        clients={clientsQ.data ?? []}
        users={usersQ.data ?? []}
      />
    </div>
  );
}
