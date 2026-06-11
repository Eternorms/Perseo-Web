"use client";

import { useActionState, useEffect, useState } from "react";
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
}: {
  clients: Array<{ id: string; name: string }>;
  defaultType?: UserType;
}) {
  const [open, setOpen] = useState(false);
  const [userType, setUserType] = useState<UserType>(defaultType);
  const [state, formAction, pending] = useActionState(inviteUserAction, INITIAL);

  const isClientUser = userType === "client_owner" || userType === "client_staff";

  useEffect(() => {
    if (state.ok) {
      toast.success("Convite enviado por e-mail.");
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="primary" size="sm" />}>
        <UserPlus /> Convidar
      </DialogTrigger>
      <DialogContent
        title="Convidar usuário"
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
                <option value="agency_staff">Equipe da agência</option>
                <option value="agency_owner">Owner da agência</option>
                <option value="client_owner">Cliente (owner)</option>
                <option value="client_staff">Cliente (equipe)</option>
              </NativeSelect>
            </div>
            {isClientUser ? (
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
