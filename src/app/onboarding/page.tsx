import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { requireOnboarding } from "@/lib/auth";
import { STEP_TITLES, TOTAL_STEPS } from "@/lib/validation/onboarding";
import { signOutAction } from "@/lib/actions/auth";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { StepForm } from "./step-form";

export const metadata: Metadata = { title: "Onboarding" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { client } = await requireOnboarding();
  const params = await searchParams;

  const requested = Number(params.step ?? client.onboarding_step);
  const maxReachable = Math.min(client.onboarding_step, TOTAL_STEPS);
  const step = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), maxReachable) : maxReachable;
  if (String(step) !== (params.step ?? String(step))) redirect(`/onboarding?step=${step}`);

  const meta = STEP_TITLES[step];

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-line px-6 py-3">
        <Logo />
        <form action={signOutAction}>
          <button type="submit" className="text-xs text-ink-faint transition-colors hover:text-ink">
            Sair
          </button>
        </form>
      </header>

      <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-10 lg:grid-cols-[230px_1fr]">
        {/* trilho de progresso */}
        <nav aria-label="Progresso do onboarding" className="lg:pt-2">
          <p className="microlabel mb-4 hidden lg:block">
            Setup <span className="num text-neon">{step}/{TOTAL_STEPS}</span>
          </p>
          <ol className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => {
              const done = n < maxReachable;
              const current = n === step;
              const reachable = n <= maxReachable;
              const item = (
                <span
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] whitespace-nowrap",
                    current ? "bg-surface-3 font-medium text-ink" : done ? "text-ink-mute" : "text-ink-faint",
                  )}
                >
                  <span
                    className={cn(
                      "num flex size-5 shrink-0 items-center justify-center rounded-sm border text-[10px]",
                      current
                        ? "border-neon/50 bg-neon/10 text-neon"
                        : done
                          ? "border-neon/30 text-neon"
                          : "border-line-strong",
                    )}
                  >
                    {done ? <Check className="size-3" aria-hidden /> : n}
                  </span>
                  <span className="hidden lg:inline">{STEP_TITLES[n].title}</span>
                </span>
              );
              return (
                <li key={n}>
                  {reachable && !current ? (
                    <a href={`/onboarding?step=${n}`} className="block transition-opacity hover:opacity-80">
                      {item}
                    </a>
                  ) : (
                    item
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* conteúdo do step */}
        <main className="animate-rise" key={step}>
          <p className="microlabel">Step {step} de {TOTAL_STEPS}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">{meta.title}</h1>
          <p className="mt-1 text-sm text-ink-mute">{meta.subtitle}</p>
          <div className="mt-6">
            <StepForm step={step} client={client} />
          </div>
        </main>
      </div>
    </div>
  );
}
