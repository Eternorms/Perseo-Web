"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { inviteUserAction } from "@/lib/actions/team";
import type { FormState } from "@/lib/actions/clients";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "@/components/ui/toast";
import type { UserType } from "@/types/database";

const INITIAL: FormState = { error: null };

export function InviteUserDialog({
  clients,
  defaultType = "agency_staff",
  fixedClient,
}: {
  clients: Array<{ id: string; name: string }>;
  defaultType?: UserType;
  /** trava o convite a um cliente específico (botão no detalhe do cliente) */
  fixedClient?: { id: string; name: string };
}) {
  const [open, setOpen] = useState(false);
  const [userType, setUserType] = useState<UserType>(fixedClient ? "client_owner" : defaultType);
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const result = await inviteUserAction(prev, fd);
    if (result.ok) {
      toast.success("Convite enviado por e-mail.");
      setOpen(false);
    }
    return result;
  }, INITIAL);

  const isClientUser = userType === "client_owner" || userType === "client_staff";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={fixedClient ? "outline" : "primary"} size="sm" />}>
        <UserPlus /> {fixedClient ? "Convidar ao portal" : "Convidar"}
      </DialogTrigger>
      <DialogContent
        title={fixedClient ? `Convidar acesso · ${fixedClient.name}` : "Convidar usuário"}
        description="A pessoa recebe um e-mail com link de acesso e define a própria senha."
      >
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="iv-name">Nome</Label>
              <Input id="iv-name" name="name" required autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="iv-email">E-mail</Label>
              <Input id="iv-email" name="email" type="email" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="iv-type">Papel</Label>
              <NativeSelect id="iv-type" name="user_type" value={userType} onChange={(e) => setUserType(e.target.value as UserType)}>
                {!fixedClient ? (
                  <>
                    <option value="agency_staff">Equipe da agência</option>
                    <option value="agency_owner">Owner da agência</option>
                  </>
                ) : null}
                <option value="client_owner">Cliente (owner)</option>
                <option value="client_staff">Cliente (equipe)</option>
              </NativeSelect>
            </div>
            {fixedClient ? (
              <input type="hidden" name="client_id" value={fixedClient.id} />
            ) : isClientUser ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="iv-client">Cliente</Label>
                <NativeSelect id="iv-client" name="client_id" required defaultValue="">
                  <option value="" disabled>
                    Selecione
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            ) : null}
          </div>

          {state.error ? (
            <p role="alert" className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="primary" type="submit" disabled={pending}>
              {pending ? "Enviando…" : "Enviar convite →"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
