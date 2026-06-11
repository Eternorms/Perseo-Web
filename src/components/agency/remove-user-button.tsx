"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { removeUserAction } from "@/lib/actions/team";
import { toast } from "@/components/ui/toast";

export function RemoveUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={`Remover ${userName}`}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Remover o acesso de ${userName}? A conta de login será apagada.`)) return;
        const fd = new FormData();
        fd.set("id", userId);
        startTransition(async () => {
          await removeUserAction(fd);
          toast.success("Acesso removido.");
        });
      }}
      className="rounded-sm p-1.5 text-ink-faint transition-colors hover:bg-loss/10 hover:text-loss disabled:opacity-40"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
