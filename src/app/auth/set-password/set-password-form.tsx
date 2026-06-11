"use client";

import { useActionState } from "react";
import { setPasswordAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL: AuthFormState = { error: null };

export function SetPasswordForm() {
  const [state, formAction, pending] = useActionState(setPasswordAction, INITIAL);

  return (
    <form action={formAction} className="mt-7 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Nova senha</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">Confirmar senha</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      {state.error ? (
        <p role="alert" className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
          {state.error}
        </p>
      ) : null}
      <Button variant="primary" type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Salvando…" : "Salvar e continuar →"}
      </Button>
    </form>
  );
}
