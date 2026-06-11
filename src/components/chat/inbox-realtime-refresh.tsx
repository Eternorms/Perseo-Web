"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Atualiza a lista de conversas quando chega mensagem de qualquer cliente
 * (refresh do server component, debounced).
 */
export function InboxRealtimeRefresh() {
  const router = useRouter();

  React.useEffect(() => {
    const supabase = createClient();
    let timer: number | undefined;
    const channel = supabase
      .channel("inbox-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "client_messages" }, () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => router.refresh(), 400);
      })
      .subscribe();
    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
