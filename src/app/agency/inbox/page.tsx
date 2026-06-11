import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { fmtRelative } from "@/lib/format";
import { PageHeader } from "@/components/kit/page-header";
import { EmptyState } from "@/components/kit/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ChatPane } from "@/components/chat/chat-pane";
import { InboxRealtimeRefresh } from "@/components/chat/inbox-realtime-refresh";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inbox" };

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  await requireAgency();
  const params = await searchParams;
  const supabase = await createClient();

  const [clientsQ, lastMessagesQ, unreadQ] = await Promise.all([
    supabase.from("clients").select("id, name, status").neq("status", "churned").order("name"),
    supabase
      .from("client_messages")
      .select("client_id, body, sender_type, created_at")
      .order("created_at", { ascending: false })
      .limit(400),
    supabase.from("client_messages").select("client_id").eq("sender_type", "client").is("read_at", null),
  ]);

  const clients = clientsQ.data ?? [];
  const lastByClient = new Map<string, { body: string; created_at: string; sender_type: string }>();
  for (const msg of lastMessagesQ.data ?? []) {
    if (!lastByClient.has(msg.client_id)) lastByClient.set(msg.client_id, msg);
  }
  const unreadByClient = new Map<string, number>();
  for (const row of unreadQ.data ?? []) {
    unreadByClient.set(row.client_id, (unreadByClient.get(row.client_id) ?? 0) + 1);
  }

  // ordena: não lidas primeiro, depois conversa mais recente
  const threads = [...clients].sort((a, b) => {
    const ua = unreadByClient.get(a.id) ?? 0;
    const ub = unreadByClient.get(b.id) ?? 0;
    if (ua !== ub) return ub - ua;
    const ta = lastByClient.get(a.id)?.created_at ?? "";
    const tb = lastByClient.get(b.id)?.created_at ?? "";
    return tb.localeCompare(ta);
  });

  const selectedId = clients.some((c) => c.id === params.client) ? (params.client as string) : (threads[0]?.id ?? null);
  const selected = clients.find((c) => c.id === selectedId) ?? null;

  const { data: thread } = selectedId
    ? await supabase
        .from("client_messages")
        .select("*")
        .eq("client_id", selectedId)
        .order("created_at", { ascending: true })
        .limit(200)
    : { data: [] };

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] flex-col gap-4 lg:h-[calc(100dvh-5rem)]">
      <PageHeader title="Inbox" subtitle="Conversas com todos os clientes — em tempo real." />
      <InboxRealtimeRefresh />

      {clients.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Nenhum cliente para conversar"
          description="Crie clientes e convide-os ao portal — as conversas aparecem aqui."
        />
      ) : (
        <Card className="flex min-h-0 flex-1 overflow-hidden p-0">
          {/* lista de conversas */}
          <aside className="flex w-full max-w-[260px] shrink-0 flex-col overflow-y-auto border-r border-line" aria-label="Conversas">
            {threads.map((c) => {
              const last = lastByClient.get(c.id);
              const unread = unreadByClient.get(c.id) ?? 0;
              const active = c.id === selectedId;
              return (
                <Link
                  key={c.id}
                  href={`/agency/inbox?client=${c.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 border-b border-line px-3 py-3 transition-colors",
                    active ? "bg-surface-3" : "hover:bg-surface-3/50",
                  )}
                >
                  <Avatar name={c.name} tone={unread > 0 ? "neon" : "default"} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn("truncate text-[13px]", unread > 0 ? "font-semibold text-ink" : "text-ink")}>{c.name}</span>
                      {last ? <span className="num shrink-0 text-[10px] text-ink-faint">{fmtRelative(last.created_at)}</span> : null}
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-ink-faint">
                        {last ? `${last.sender_type === "agency" ? "Você: " : ""}${last.body}` : "Sem mensagens"}
                      </span>
                      {unread > 0 ? (
                        <span className="num shrink-0 rounded-full bg-neon px-1.5 text-[10px] font-semibold text-onneon">{unread}</span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              );
            })}
          </aside>

          {/* conversa */}
          <div className="flex min-w-0 flex-1 flex-col">
            {selected ? (
              <>
                <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
                  <Avatar name={selected.name} />
                  <div>
                    <p className="text-sm font-medium text-ink">{selected.name}</p>
                    <p className="text-[11px] text-ink-faint">portal do cliente</p>
                  </div>
                </header>
                <ChatPane clientId={selected.id} viewer="agency" initialMessages={thread ?? []} />
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-xs text-ink-faint">Selecione uma conversa.</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
