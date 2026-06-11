import "server-only";

import { adminConfigured, perseoDb } from "@/lib/supabase/admin";
import type { CampaignResultRow, CreativeApprovalRow } from "@/types/perseo";

/**
 * Ponte public ⇄ perseo. Tudo aqui roda server-side com service role e
 * degrada com elegância: `configured=false` → UI mostra estado de setup,
 * nunca tela quebrada.
 */

export interface BridgeResult<T> {
  /** envs do admin presentes e schema acessível */
  configured: boolean;
  rows: T[];
}

export async function fetchCreativesForPerseoClient(perseoClientId: number): Promise<BridgeResult<CreativeApprovalRow>> {
  if (!adminConfigured()) return { configured: false, rows: [] };
  try {
    const { data, error } = await perseoDb()
      .from("creative_approvals")
      .select("*")
      .eq("client_id", perseoClientId)
      .order("submitted_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return { configured: true, rows: (data ?? []) as CreativeApprovalRow[] };
  } catch {
    return { configured: false, rows: [] };
  }
}

export async function fetchCreativesForPerseoClients(
  perseoClientIds: number[],
): Promise<BridgeResult<CreativeApprovalRow>> {
  if (!adminConfigured() || perseoClientIds.length === 0) return { configured: adminConfigured(), rows: [] };
  try {
    const { data, error } = await perseoDb()
      .from("creative_approvals")
      .select("*")
      .in("client_id", perseoClientIds)
      .order("submitted_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return { configured: true, rows: (data ?? []) as CreativeApprovalRow[] };
  } catch {
    return { configured: false, rows: [] };
  }
}

export async function fetchCampaignResults(
  perseoClientIds: number[],
  opts?: { sinceDate?: string },
): Promise<BridgeResult<CampaignResultRow>> {
  if (!adminConfigured() || perseoClientIds.length === 0) return { configured: adminConfigured(), rows: [] };
  try {
    let query = perseoDb().from("campaign_results").select("*").in("client_id", perseoClientIds);
    if (opts?.sinceDate) query = query.gte("date", opts.sinceDate);
    const { data, error } = await query.order("date", { ascending: true, nullsFirst: true });
    if (error) throw error;
    return { configured: true, rows: (data ?? []) as CampaignResultRow[] };
  } catch {
    return { configured: false, rows: [] };
  }
}
