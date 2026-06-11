import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppUserRow, ClientRow } from "@/types/database";

export interface SessionContext {
  appUser: AppUserRow;
  /** registro do cliente quando o usuário é client_* */
  client: ClientRow | null;
}

/**
 * DAL — única fonte de verdade de autorização nas camadas de página/ação.
 * `cache` deduplica por request (layout + page + actions na mesma render).
 */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: appUser } = await supabase
    .from("app_users")
    .select("*")
    .eq("supabase_uid", user.id)
    .maybeSingle();
  if (!appUser) return null;

  let client: ClientRow | null = null;
  if (appUser.client_id) {
    const { data } = await supabase.from("clients").select("*").eq("id", appUser.client_id).maybeSingle();
    client = data ?? null;
  }
  return { appUser: appUser as AppUserRow, client };
});

export function isAgency(user: AppUserRow): boolean {
  return user.user_type === "agency_owner" || user.user_type === "agency_staff";
}

export function isClient(user: AppUserRow): boolean {
  return user.user_type === "client_owner" || user.user_type === "client_staff";
}

/** Destino pós-login por papel + estado de onboarding. */
export function homePathFor(ctx: SessionContext): string {
  if (isAgency(ctx.appUser)) return "/agency/dashboard";
  if (ctx.client && ctx.client.status === "onboarding") return "/onboarding";
  return "/client/dashboard";
}

/** Exige usuário da agência; redireciona caso contrário. */
export async function requireAgency(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login?next=/agency/dashboard");
  if (!isAgency(ctx.appUser)) redirect(homePathFor(ctx));
  return ctx;
}

/**
 * Exige usuário de cliente com vínculo válido. Onboarding incompleto
 * bloqueia o portal (regra de negócio) e redireciona para o wizard.
 */
export async function requireClient(): Promise<SessionContext & { client: ClientRow }> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login?next=/client/dashboard");
  if (isAgency(ctx.appUser)) redirect("/agency/dashboard");
  if (!ctx.client) redirect("/login?error=sem_vinculo");
  if (ctx.client.status === "onboarding") redirect("/onboarding");
  return { ...ctx, client: ctx.client };
}

/** Contexto do wizard de onboarding (cliente ainda não ativo). */
export async function requireOnboarding(): Promise<SessionContext & { client: ClientRow }> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login?next=/onboarding");
  if (isAgency(ctx.appUser)) redirect("/agency/dashboard");
  if (!ctx.client) redirect("/login?error=sem_vinculo");
  if (ctx.client.status !== "onboarding") redirect("/client/dashboard");
  return { ...ctx, client: ctx.client };
}

/** Owner da agência (gestão de time, exclusões). */
export async function requireOwner(): Promise<SessionContext> {
  const ctx = await requireAgency();
  if (ctx.appUser.user_type !== "agency_owner") redirect("/agency/dashboard");
  return ctx;
}
