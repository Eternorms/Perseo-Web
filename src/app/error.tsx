"use client";

import { useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div>
        <h1 className="text-lg font-semibold text-ink">Algo quebrou por aqui</h1>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-mute">
          Falha temporária ao carregar esta tela. Tente novamente — se persistir, fale com a Perseo.
        </p>
        {error.digest ? <p className="num mt-2 text-[10px] text-ink-faint">ref {error.digest}</p> : null}
      </div>
      <Button variant="primary" onClick={reset}>
        Tentar novamente
      </Button>
    </main>
  );
}
