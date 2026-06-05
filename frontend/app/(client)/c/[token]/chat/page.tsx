"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { ChatMessage } from "@/lib/types";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function load() {
    api.get<ChatMessage[]>("/api/client/chat/messages").then((msgs) => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function send() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await api.post("/api/client/chat/messages", { content: input });
      setInput("");
      load();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 10rem)" }}>
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-white">Chat</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Fale diretamente com a equipe Perseo</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3">
        {messages.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center mt-8">
            Nenhuma mensagem ainda. Diga olá!
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_type === "client" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                m.sender_type === "client"
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-800 text-zinc-200"
              }`}>
                {m.sender_type !== "client" && m.sender_name && (
                  <p className="text-xs font-medium opacity-70 mb-0.5">{m.sender_name}</p>
                )}
                <p>{m.content}</p>
                <p className="text-xs opacity-40 mt-0.5 text-right">
                  {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Digite sua mensagem..."
          className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="px-5 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm rounded-xl transition-colors"
        >
          {sending ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
