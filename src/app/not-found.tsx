import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <p className="num text-6xl font-semibold text-ink">
        4<span className="text-neon glow-neon">0</span>4
      </p>
      <div>
        <h1 className="text-lg font-semibold text-ink">Página não encontrada</h1>
        <p className="mt-1 text-sm text-ink-mute">O endereço pode ter mudado ou nunca existiu.</p>
      </div>
      <Link href="/">
        <Button variant="primary">Voltar ao início →</Button>
      </Link>
    </main>
  );
}
