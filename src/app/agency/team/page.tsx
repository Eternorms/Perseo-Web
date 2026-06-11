import type { Metadata } from "next";
import { UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { USER_TYPE } from "@/lib/labels";
import { PageHeader } from "@/components/kit/page-header";
import { EmptyState } from "@/components/kit/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InviteUserDialog } from "@/components/agency/invite-user-dialog";
import { RemoveUserButton } from "@/components/agency/remove-user-button";

export const metadata: Metadata = { title: "Time" };

export default async function TeamPage() {
  const { appUser } = await requireAgency();
  const isOwner = appUser.user_type === "agency_owner";

  const supabase = await createClient();
  const [usersQ, clientsQ] = await Promise.all([
    supabase.from("app_users").select("*, clients(name)").order("created_at", { ascending: true }),
    supabase.from("clients").select("id, name").order("name"),
  ]);
  const users = usersQ.data ?? [];
  const clients = clientsQ.data ?? [];

  const agencyUsers = users.filter((u) => u.user_type === "agency_owner" || u.user_type === "agency_staff");
  const clientUsers = users.filter((u) => u.user_type === "client_owner" || u.user_type === "client_staff");

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Time"
        subtitle="Acessos da agência e dos portais de cliente."
        actions={isOwner ? <InviteUserDialog clients={clients} /> : undefined}
      />

      <section className="flex flex-col gap-3">
        <h2 className="microlabel">Agência</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="text-right">Desde</TableHead>
                {isOwner ? <TableHead className="w-16 text-right">Ações</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {agencyUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={u.name} tone={u.id === appUser.id ? "neon" : "default"} />
                      <span>
                        <span className="font-medium">
                          {u.name} {u.id === appUser.id ? <span className="text-[10px] text-neon">(você)</span> : null}
                        </span>
                        <span className="block text-[11px] text-ink-faint">{u.email}</span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge tone={u.user_type === "agency_owner" ? "neon" : "neutral"}>{USER_TYPE[u.user_type]}</Badge>
                  </TableCell>
                  <TableCell className="num text-right text-ink-mute">{fmtDate(u.created_at)}</TableCell>
                  {isOwner ? (
                    <TableCell className="text-right">
                      {u.id !== appUser.id ? <RemoveUserButton userId={u.id} userName={u.name} /> : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="microlabel">Portais de cliente</h2>
        {clientUsers.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Nenhum acesso de cliente"
            description="Convide o responsável de cada marca para o portal — ele aprova criativos, acompanha resultados e conversa com você por lá."
            action={isOwner ? <InviteUserDialog clients={clients} defaultType="client_owner" /> : undefined}
          />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="text-right">Desde</TableHead>
                  {isOwner ? <TableHead className="w-16 text-right">Ações</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <span className="flex items-center gap-2.5">
                        <Avatar name={u.name} />
                        <span>
                          <span className="font-medium">{u.name}</span>
                          <span className="block text-[11px] text-ink-faint">{u.email}</span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-ink-mute">{u.clients?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge tone="info">{USER_TYPE[u.user_type]}</Badge>
                    </TableCell>
                    <TableCell className="num text-right text-ink-mute">{fmtDate(u.created_at)}</TableCell>
                    {isOwner ? (
                      <TableCell className="text-right">
                        <RemoveUserButton userId={u.id} userName={u.name} />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>
    </div>
  );
}
