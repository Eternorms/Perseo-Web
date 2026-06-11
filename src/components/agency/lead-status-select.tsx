"use client";

import { useRef, useTransition } from "react";
import { updateLeadStatusAction } from "@/lib/actions/leads";
import { LEAD_STATUS } from "@/lib/labels";
import type { LeadStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<string, string> = {
  neon: "border-neon/30 bg-neon/10 text-neon",
  loss: "border-loss/30 bg-loss/10 text-loss",
  warn: "border-warn/30 bg-warn/10 text-warn",
  info: "border-info/30 bg-info/10 text-info",
  neutral: "border-line-strong bg-surface-3 text-ink-mute",
};

/** Select compacto que move o lead no funil direto da tabela. */
export function LeadStatusSelect({ leadId, clientId, status }: { leadId: string; clientId: string; status: LeadStatus }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(fd) => startTransition(() => updateLeadStatusAction(fd))}
      className="inline-flex"
    >
      <input type="hidden" name="id" value={leadId} />
      <input type="hidden" name="client_id" value={clientId} />
      <select
        name="status"
        defaultValue={status}
        disabled={pending}
        aria-label="Status do lead"
        onChange={() => formRef.current?.requestSubmit()}
        className={cn(
          "h-6 cursor-pointer appearance-none rounded-sm border px-1.5 text-[11px] font-medium outline-none transition-opacity",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon",
          pending && "opacity-50",
          TONE_CLASS[LEAD_STATUS[status].tone],
          "[&_option]:bg-surface-1 [&_option]:text-ink",
        )}
      >
        {Object.entries(LEAD_STATUS).map(([value, def]) => (
          <option key={value} value={value}>
            {def.label}
          </option>
        ))}
      </select>
    </form>
  );
}
