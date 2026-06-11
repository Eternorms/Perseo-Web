"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { CLIENT_STATUS } from "@/lib/labels";

/** Busca + filtro de status sincronizados na URL (estado compartilhável). */
export function ClientsFilter({ q, status }: { q: string; status: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function apply(next: { q?: string; status?: string }) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`/agency/clients?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs">
        <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
        <Input
          type="search"
          aria-label="Buscar clientes"
          placeholder="Buscar por nome, razão social, e-mail…"
          defaultValue={q}
          className="pl-8"
          onChange={(e) => {
            const value = e.target.value;
            window.clearTimeout((window as { __clientsFilterT?: number }).__clientsFilterT);
            (window as { __clientsFilterT?: number }).__clientsFilterT = window.setTimeout(() => apply({ q: value }), 300);
          }}
        />
      </div>
      <NativeSelect
        aria-label="Filtrar por status"
        className="w-44"
        value={status}
        onChange={(e) => apply({ status: e.target.value })}
      >
        <option value="">Todos os status</option>
        {Object.entries(CLIENT_STATUS).map(([value, def]) => (
          <option key={value} value={value}>
            {def.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
