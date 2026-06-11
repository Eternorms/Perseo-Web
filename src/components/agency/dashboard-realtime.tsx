"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Mantém o dashboard da agência "ao vivo": novos leads, agendamentos e
 * solicitações do agente refrescam os server components (debounced).
 */
export function DashboardRealtime() {
  const router = useRouter();

  React.useEffect(() => {
    const supabase = createClient();
    let timer: number | undefined;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => router.refresh(), 500);
    };
    const channel = supabase
      .channel("agency-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_actions" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, refresh)
      .subscribe();
    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
