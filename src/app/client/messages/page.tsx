import type { Metadata } from "next";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/kit/page-header";
import { Card } from "@/components/ui/card";
import { ChatPane } from "@/components/chat/chat-pane";

export const metadata: Metadata = { title: "Mensagens" };

export default async function ClientMessagesPage() {
  const { client } = await requireClient();
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("client_messages")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <div className="flex h-[calc(100dvh-14rem)] min-h-[420px] flex-col gap-5">
      <PageHeader
        title="Mensagens"
        subtitle="Canal direto com seu estrategista Perseo — respostas em horário comercial."
      />
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <ChatPane
          clientId={client.id}
          viewer="client"
          initialMessages={messages ?? []}
          placeholder="Escreva para a Perseo…"
        />
      </Card>
    </div>
  );
}
