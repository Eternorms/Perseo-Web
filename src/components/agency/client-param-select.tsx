"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { NativeSelect } from "@/components/ui/native-select";

/** Seletor de cliente sincronizado na URL (?client=) — padrão das telas por cliente. */
export function ClientParamSelect({
  clients,
  selected,
  basePath,
  allowAll,
}: {
  clients: Array<{ id: string; name: string }>;
  selected: string;
  basePath: string;
  allowAll?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <NativeSelect
      aria-label="Selecionar cliente"
      className="w-48"
      value={selected}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams);
        if (e.target.value) params.set("client", e.target.value);
        else params.delete("client");
        router.replace(`${basePath}?${params.toString()}`);
      }}
    >
      {allowAll ? <option value="">Todos os clientes</option> : null}
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </NativeSelect>
  );
}
