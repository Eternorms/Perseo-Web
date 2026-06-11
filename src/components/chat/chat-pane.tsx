"use client";

import * as React from "react";
import { SendHorizonal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markThreadReadAction, sendMessageAction, type SendMessageState } from "@/lib/actions/messages";
import { fmtTime } from "@/lib/format";
import type { ClientMessageRow, SenderType } from "@/types/database";
import { cn } from "@/lib/utils";

const INITIAL: SendMessageState = { error: null };

type Msg = ClientMessageRow & { pending?: boolean };

/**
 * Chat em tempo real agência ⇄ cliente (Supabase Realtime, RLS aplicada).
 * Envio otimista; eco do realtime substitui a mensagem provisória.
 */
export function ChatPane({
  clientId,
  viewer,
  initialMessages,
  placeholder,
}: {
  clientId: string;
  viewer: SenderType;
  initialMessages: ClientMessageRow[];
  placeholder?: string;
}) {
  const [messages, setMessages] = React.useState<Msg[]>(initialMessages);
  const [state, formAction, pending] = React.useActionState(sendMessageAction, INITIAL);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const textRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => setMessages(initialMessages), [initialMessages]);

  // realtime: INSERTs desta conversa
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${clientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "client_messages", filter: `client_id=eq.${clientId}` },
        (payload) => {
          const incoming = payload.new as ClientMessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            // substitui otimista equivalente (mesmo lado + mesmo corpo)
            const optimisticIdx = prev.findIndex((m) => m.pending && m.sender_type === incoming.sender_type && m.body === incoming.body);
            if (optimisticIdx >= 0) {
              const next = [...prev];
              next[optimisticIdx] = incoming;
              return next;
            }
            return [...prev, incoming];
          });
          if (incoming.sender_type !== viewer) void markThreadReadAction(clientId);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clientId, viewer]);

  // marca lidas ao abrir a conversa
  React.useEffect(() => {
    void markThreadReadAction(clientId);
  }, [clientId]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function handleSubmit(formData: FormData) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        client_id: clientId,
        sender_id: "",
        sender_type: viewer,
        body,
        read_at: null,
        created_at: new Date().toISOString(),
        pending: true,
      },
    ]);
    formAction(formData);
    formRef.current?.reset();
    textRef.current?.focus();
  }

  let lastDay = "";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4" role="log" aria-label="Mensagens" aria-live="polite">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-xs text-ink-faint">
            Nenhuma mensagem ainda — esta conversa fica registrada para vocês dois.
          </p>
        ) : null}
        {messages.map((msg) => {
          const day = new Date(msg.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
          const showDay = day !== lastDay;
          lastDay = day;
          const own = msg.sender_type === viewer;
          return (
            <React.Fragment key={msg.id}>
              {showDay ? <p className="microlabel py-2 text-center">{day}</p> : null}
              <div className={cn("flex", own ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-lg border px-3 py-2",
                    own ? "border-neon/20 bg-neon/5" : "border-line bg-surface-2",
                    msg.pending && "opacity-60",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink">{msg.body}</p>
                  <p className={cn("num mt-1 text-[10px]", own ? "text-right text-neon/60" : "text-ink-faint")}>
                    {msg.pending ? "enviando…" : fmtTime(msg.created_at)}
                  </p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form ref={formRef} action={handleSubmit} className="flex items-end gap-2 border-t border-line p-3">
        <input type="hidden" name="client_id" value={clientId} />
        <textarea
          ref={textRef}
          name="body"
          rows={1}
          required
          maxLength={4000}
          aria-label="Escrever mensagem"
          placeholder={placeholder ?? "Escreva uma mensagem…"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          className={cn(
            "max-h-32 min-h-9 flex-1 resize-none rounded-md border border-line bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink-faint",
            "focus-visible:border-neon/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/20",
          )}
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Enviar mensagem"
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-neon text-onneon transition-colors hover:bg-neon-dim disabled:opacity-50"
        >
          <SendHorizonal className="size-4" />
        </button>
      </form>
      {state.error ? (
        <p role="alert" className="border-t border-loss/20 bg-loss/5 px-4 py-1.5 text-[11px] text-loss">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
