import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext, homePathFor } from "@/lib/auth";
import { safeInternalPath } from "@/lib/validation/auth";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Entrar" };

const ERROR_MESSAGES: Record<string, string> = {
  oauth: "Falha ao conectar com o Google. Tente novamente.",
  sem_vinculo: "Sua conta não está vinculada a nenhum cliente. Fale com a agência.",
  callback: "Link de acesso inválido ou expirado.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getSessionContext();
  if (ctx) redirect(safeInternalPath(params.next, homePathFor(ctx)));

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* painel de marca */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-surface-1 p-10 lg:flex">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <Link href="/" className="relative z-10 w-fit">
          <Logo />
        </Link>
        <div className="relative z-10 max-w-md">
          <p className="microlabel mb-4">Operação ao vivo</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Da inteligência de mercado ao criativo, landing e relatório.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-mute">
            Um parceiro sênior de growth — não cinco fornecedores soltos. Velocidade de teste,
            funil integrado e proteção contra fraude.
          </p>
          <dl className="num mt-10 grid grid-cols-3 gap-6 border-t border-line pt-6 text-sm">
            <div>
              <dt className="microlabel mb-1">Teste criativo</dt>
              <dd className="text-neon">D+7</dd>
            </div>
            <div>
              <dt className="microlabel mb-1">Funil</dt>
              <dd>full-stack</dd>
            </div>
            <div>
              <dt className="microlabel mb-1">ROAS</dt>
              <dd>anti-fraude</dd>
            </div>
          </dl>
        </div>
        <p className="relative z-10 text-[11px] text-ink-faint">© {new Date().getFullYear()} Perseo</p>
      </aside>

      {/* formulário */}
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-rise">
          <Link href="/" className="mb-10 block w-fit lg:hidden">
            <Logo />
          </Link>
          <h2 className="text-xl font-semibold tracking-tight">Entrar na plataforma</h2>
          <p className="mt-1 text-sm text-ink-mute">Acesso da agência e portal do cliente.</p>
          {params.error && ERROR_MESSAGES[params.error] ? (
            <p role="alert" className="mt-4 rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
              {ERROR_MESSAGES[params.error]}
            </p>
          ) : null}
          <LoginForm next={params.next ?? null} />
        </div>
      </main>
    </div>
  );
}
