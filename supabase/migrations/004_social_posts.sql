-- Tabela de posts agendados (criados pelo App 2 local, publicados pelo worker online)
CREATE TABLE IF NOT EXISTS social_posts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform       text NOT NULL DEFAULT 'instagram'
                   CHECK (platform IN ('instagram', 'facebook')),
  caption        text,
  media_url      text,
  media_type     text DEFAULT 'image'
                   CHECK (media_type IN ('image', 'video', 'carousel')),
  scheduled_at   timestamptz NOT NULL,
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'published', 'failed', 'cancelled')),
  meta_post_id   text,
  error          text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_posts: agency CRUD" ON social_posts FOR ALL
  USING ((current_app_user()).user_type IN ('agency_owner', 'agency_staff'));

CREATE POLICY "social_posts: client read" ON social_posts FOR SELECT
  USING ((current_app_user()).client_id = client_id);

-- Token de página Meta por cliente (necessário para publicar posts)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS meta_page_access_token text;

-- Métricas de campanha coletadas pelo worker (para análise local)
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date         date NOT NULL,
  platform     text NOT NULL DEFAULT 'meta',
  impressions  integer DEFAULT 0,
  reach        integer DEFAULT 0,
  clicks       integer DEFAULT 0,
  leads        integer DEFAULT 0,
  spend        numeric(10,2) DEFAULT 0,
  cpl          numeric(10,2),
  collected_at timestamptz DEFAULT now(),
  UNIQUE (client_id, date, platform)
);

ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_metrics: agency CRUD" ON campaign_metrics FOR ALL
  USING ((current_app_user()).user_type IN ('agency_owner', 'agency_staff'));

CREATE POLICY "campaign_metrics: client read" ON campaign_metrics FOR SELECT
  USING ((current_app_user()).client_id = client_id);
