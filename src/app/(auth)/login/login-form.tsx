"use client";

import { useActionState } from "react";
import { signInAction, signInWithGoogleAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL: AuthFormState = { error: null };

export function LoginForm({ next }: { next: string | null }) {
  const [state, formAction, pending] = useActionState(signInAction, INITIAL);

  return (
    <div className="mt-7">
      <form action={signInWithGoogleAction}>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Button variant="outline" className="w-full" size="md" type="submit">
          <GoogleIcon />
          Continuar com Google
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        <span className="microlabel">ou</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@empresa.com" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
        </div>
        {state.error ? (
          <p role="alert" className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
            {state.error}
          </p>
        ) : null}
        <Button variant="primary" type="submit" disabled={pending} className="mt-1 w-full">
          {pending ? "Entrando…" : "Entrar →"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-faint">
        Acesso por convite. Cliente Perseo sem acesso? Fale com seu estrategista.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="currentColor"
        d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.509h3.232c1.891-1.741 2.982-4.305 2.982-7.35z"
      />
      <path
        fill="currentColor"
        opacity=".7"
        d="M12 22c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22z"
      />
      <path
        fill="currentColor"
        opacity=".5"
        d="M6.405 13.9a6.01 6.01 0 0 1 0-3.8V7.51H3.064a10.01 10.01 0 0 0 0 8.98L6.405 13.9z"
      />
      <path
        fill="currentColor"
        opacity=".85"
        d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.959 2.99 14.695 2 12 2a9.996 9.996 0 0 0-8.936 5.51l3.34 2.59C7.19 7.737 9.396 5.977 12 5.977z"
      />
    </svg>
  );
}
