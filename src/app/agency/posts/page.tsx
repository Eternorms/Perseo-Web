import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { POST_STATUS, PLATFORM_LABEL } from "@/lib/labels";
import { fmtDateTime } from "@/lib/format";
import { PageHeader } from "@/components/kit/page-header";
import { EmptyState } from "@/components/kit/empty-state";
import { StatusBadge } from "@/components/kit/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostComposer } from "@/components/agency/post-composer";
import { PostRowActions } from "@/components/agency/post-row-actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Posts" };

const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const PLATFORM_DOT: Record<string, string> = { instagram: "#E1306C", facebook: "#5BA3FF", tiktok: "#EDEFF3" };

function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function dayKey(d: Date) {
  return `${ymKey(d)}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireAgency();
  const params = await searchParams;

  const today = new Date();
  const m = /^(\d{4})-(\d{2})$/.exec(params.month ?? "");
  const year = m ? Number(m[1]) : today.getFullYear();
  const month = m ? Number(m[2]) - 1 : today.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const supabase = await createClient();
  const [postsQ, clientsQ] = await Promise.all([
    supabase
      .from("social_posts")
      .select("*, clients(name)")
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name").neq("status", "churned").order("name"),
  ]);
  const posts = postsQ.data ?? [];
  const clients = clientsQ.data ?? [];

  const monthPosts = posts.filter((p) => {
    if (!p.scheduled_at) return false;
    const d = new Date(p.scheduled_at);
    return d >= first && d <= new Date(year, month + 1, 0, 23, 59, 59);
  });
  const byDay = new Map<string, typeof posts>();
  for (const p of monthPosts) {
    const k = dayKey(new Date(p.scheduled_at as string));
    byDay.set(k, [...(byDay.get(k) ?? []), p]);
  }

  const drafts = posts.filter((p) => p.status === "draft");
  const upcoming = posts.filter((p) => p.status === "scheduled" && p.scheduled_at && new Date(p.scheduled_at) >= today);

  const startOffset = (first.getDay() + 6) % 7;
  const cells: Array<Date | null> = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: last.getDate() }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = first.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Posts"
        subtitle="Agendamento de postagens orgânicas por cliente."
        actions={<PostComposer clients={clients} />}
      />

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="capitalize">{monthLabel}</CardTitle>
            <div className="flex items-center gap-1">
              <Link
                href={`/agency/posts?month=${ymKey(new Date(year, month - 1, 1))}`}
                aria-label="Mês anterior"
                className="rounded-md p-1.5 text-ink-mute transition-colors hover:bg-surface-3 hover:text-ink"
              >
                <ChevronLeft className="size-4" />
              </Link>
              <Link href="/agency/posts" className="rounded-md px-2 py-1 text-xs text-ink-mute transition-colors hover:bg-surface-3 hover:text-ink">
                hoje
              </Link>
              <Link
                href={`/agency/posts?month=${ymKey(new Date(year, month + 1, 1))}`}
                aria-label="Próximo mês"
                className="rounded-md p-1.5 text-ink-mute transition-colors hover:bg-surface-3 hover:text-ink"
              >
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => (
                <span key={d} className="microlabel px-1.5 py-1 text-center">
                  {d}
                </span>
              ))}
              {cells.map((date, i) => {
                if (!date) return <span key={`x-${i}`} aria-hidden />;
                const k = dayKey(date);
                const dayPosts = byDay.get(k) ?? [];
                const isToday = dayKey(today) === k;
                return (
                  <div key={k} className="flex min-h-16 flex-col gap-1 rounded-md border border-line p-1.5">
                    <span className={cn("num self-end rounded-sm px-1 text-[11px]", isToday ? "bg-neon text-onneon font-semibold" : "text-ink-faint")}>
                      {date.getDate()}
                    </span>
                    {dayPosts.slice(0, 2).map((p) => (
                      <span key={p.id} className="flex items-center gap-1 truncate rounded-sm bg-surface-3 px-1 py-0.5 text-[10px] text-ink-mute">
                        <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: PLATFORM_DOT[p.platform] }} />
                        {p.clients?.name ?? PLATFORM_LABEL[p.platform]}
                      </span>
                    ))}
                    {dayPosts.length > 2 ? <span className="num text-[10px] text-neon">+{dayPosts.length - 2}</span> : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Fila de publicação</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-3">
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={Send}
                  title="Nada agendado"
                  description="Componha um post e agende — a publicação integra com o pipeline."
                  className="border-0 py-8"
                />
              ) : (
                upcoming.slice(0, 8).map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-3 rounded-md border border-line p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">{p.clients?.name ?? "—"}</p>
                      <p className="truncate text-[11px] text-ink-faint">
                        {PLATFORM_LABEL[p.platform]} · <span className="num">{fmtDateTime(p.scheduled_at)}</span>
                      </p>
                      {p.caption ? <p className="mt-1 line-clamp-1 text-[11px] text-ink-mute">{p.caption}</p> : null}
                    </div>
                    <PostRowActions post={p} clients={clients} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rascunhos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-3">
              {drafts.length === 0 ? (
                <p className="py-4 text-center text-xs text-ink-faint">Sem rascunhos.</p>
              ) : (
                drafts.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-3/60">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-ink">{p.clients?.name ?? "—"} · {PLATFORM_LABEL[p.platform]}</p>
                      {p.caption ? <p className="line-clamp-1 text-[11px] text-ink-faint">{p.caption}</p> : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge def={POST_STATUS[p.status]} />
                      <PostRowActions post={p} clients={clients} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
