/**
 * Tipos do schema `perseo` — engine de produção UGC (app desktop é o dono).
 * Este app SÓ LÊ, com exceção única da decisão de aprovação de criativo
 * (creative_approvals.status / client_feedback / decided_at).
 *
 * Contrato best-effort: campos são tratados como anuláveis e as leituras
 * devem degradar com elegância se colunas estiverem vazias.
 */

export type CreativeStatus = "pending" | "approved" | "rejected" | "revision";

export type PerseoClientRow = {
  id: number;
  name: string | null;
}

export type PerseoVideoRow = {
  id: number;
  client_id: number | null;
  title: string | null;
  video_url: string | null;
  created_at: string | null;
}

export type CreativeApprovalRow = {
  id: number;
  client_id: number;
  video_id: number | null;
  title: string | null;
  description: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  status: CreativeStatus;
  client_feedback: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  scheduled_at: string | null;
  meta_post_id: string | null;
}

export type CampaignResultRow = {
  id: number;
  client_id: number;
  video_id: number | null;
  date: string | null;
  roas: number | null;
  cpa: number | null;
  hook_rate: number | null;
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  fraud_rate: number | null;
  fraud_clicks: number | null;
}

export type KgEntityRow = {
  id: number;
  client_id: number | null;
  type: string;
  key: string;
  attrs: Record<string, unknown> | null;
}

export type KgEdgeRow = {
  id: number;
  src_id: number;
  rel: string;
  dst_id: number;
  weight: number | null;
  attrs: Record<string, unknown> | null;
}

type Def<R> = { Row: R; Insert: Partial<R>; Update: Partial<R>; Relationships: [] };

export type PerseoSchema = {
  Tables: {
    clients: Def<PerseoClientRow>;
    videos: Def<PerseoVideoRow>;
    creative_approvals: Def<CreativeApprovalRow>;
    campaign_results: Def<CampaignResultRow>;
    kg_entities: Def<KgEntityRow>;
    kg_edges: Def<KgEdgeRow>;
  };
  Views: Record<string, never>;
  Functions: Record<string, never>;
  Enums: Record<string, never>;
  CompositeTypes: Record<string, never>;
}
