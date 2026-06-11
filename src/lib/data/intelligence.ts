import "server-only";

import { adminConfigured, perseoDb } from "@/lib/supabase/admin";
import type { KgEdgeRow, KgEntityRow } from "@/types/perseo";

export interface KgData {
  configured: boolean;
  entities: KgEntityRow[];
  edges: KgEdgeRow[];
}

/**
 * Knowledge Graph criativo (perseo.kg_*): dor → ângulo → hook → resultado.
 * Leitura limitada e defensiva — grafos grandes são paginados pelo peso.
 */
export async function fetchKnowledgeGraph(perseoClientId: number | null): Promise<KgData> {
  if (!adminConfigured()) return { configured: false, entities: [], edges: [] };
  try {
    const db = perseoDb();
    let entitiesQ = db.from("kg_entities").select("*").limit(800);
    if (perseoClientId != null) entitiesQ = entitiesQ.eq("client_id", perseoClientId);
    const { data: entities, error: e1 } = await entitiesQ;
    if (e1) throw e1;

    const ids = (entities ?? []).map((e) => e.id);
    if (ids.length === 0) return { configured: true, entities: [], edges: [] };

    const { data: edges, error: e2 } = await db
      .from("kg_edges")
      .select("*")
      .in("src_id", ids)
      .order("weight", { ascending: false, nullsFirst: false })
      .limit(2000);
    if (e2) throw e2;

    return { configured: true, entities: (entities ?? []) as KgEntityRow[], edges: (edges ?? []) as KgEdgeRow[] };
  } catch {
    return { configured: false, entities: [], edges: [] };
  }
}
