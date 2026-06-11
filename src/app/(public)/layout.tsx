import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/#metodologia", label: "Metodologia" },
  { href: "/#capacidades", label: "Capacidades" },
  { href: "/#ofertas", label: "Ofertas" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line glass">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-6 px-5">
          <Link href="/" aria-label="Perseo — início">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-[13px] text-ink-mute transition-colors hover:text-ink">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-2 text-[13px] text-ink-mute transition-colors hover:text-ink">
              Entrar
            </Link>
            <Link href="/#contato">
              <Button variant="primary" size="sm">
                Pedir análise →
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line bg-surface-1">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-xs leading-relaxed text-ink-mute">
              Parceiro de crescimento full-funnel alavancado por IA para marcas D2C e e-commerce.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-[13px]">
            <div className="flex flex-col gap-2.5">
              <span className="microlabel">Navegação</span>
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="text-ink-mute transition-colors hover:text-ink">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="microlabel">Plataforma</span>
              <Link href="/login" className="text-ink-mute transition-colors hover:text-ink">
                Entrar
              </Link>
              <Link href="/privacy" className="text-ink-mute transition-colors hover:text-ink">
                Privacidade
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
            <p className="text-[11px] text-ink-faint">© {new Date().getFullYear()} Perseo. Todos os direitos reservados.</p>
            <p className="microlabel">growth · ai-first</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
