-- ============================================================
-- Perseo Agency — Schema inicial
-- Rodar no Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Limpar tabelas antigas (caso existam com tipos diferentes)
DROP TABLE IF EXISTS job_queue            CASCADE;
DROP TABLE IF EXISTS agent_actions        CASCADE;
DROP TABLE IF EXISTS client_notifications CASCADE;
DROP TABLE IF EXISTS client_messages      CASCADE;
DROP TABLE IF EXISTS followup_queue       CASCADE;
DROP TABLE IF EXISTS appointments         CASCADE;
DROP TABLE IF EXISTS leads                CASCADE;
DROP TABLE IF EXISTS app_users            CASCADE;
DROP TABLE IF EXISTS clients              CASCADE;
DROP FUNCTION IF EXISTS current_app_user  CASCADE;

-- ── clients ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  business_name       text NOT NULL,
  niche               text,
  status              text NOT NULL DEFAULT 'onboarding'
                        CHECK (status IN ('onboarding','active','paused','churned')),
  onboarding_step     int  DEFAULT 1,
  -- WhatsApp
  whatsapp_type       text CHECK (whatsapp_type IN ('evolution','meta')),
  whatsapp_instance   text,
  whatsapp_phone      text,
  -- Meta Ads
  meta_page_id        text,
  meta_form_id        text,
  -- Google Calendar
  calendar_id         text,
  -- Agente
  agent_prompt        text,
  agent_active        bool DEFAULT false,
  -- Financeiro
  plan                text DEFAULT 'starter',
  monthly_value       numeric(10,2),
  -- Contato principal
  contact_name        text,
  contact_phone       text,
  contact_email       text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ── app_users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_uid uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type    text NOT NULL
                 CHECK (user_type IN ('agency_owner','agency_staff','client_owner','client_staff')),
  name         text NOT NULL,
  email        text NOT NULL,
  client_id    uuid REFERENCES clients(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now()
);

-- ── leads ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id               uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name                    text,
  phone                   text NOT NULL,
  email                   text,
  source                  text DEFAULT 'meta_lead_form',
  status                  text NOT NULL DEFAULT 'new'
                            CHECK (status IN ('new','contacted','qualified','scheduled','converted','lost')),
  meta_lead_id            text,
  first_contact_at        timestamptz,
  response_time_seconds   int,
  notes                   text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- ── appointments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_id           uuid REFERENCES leads(id),
  patient_name      text NOT NULL,
  patient_phone     text,
  scheduled_at      timestamptz NOT NULL,
  calendar_event_id text,
  status            text NOT NULL DEFAULT 'scheduled'
                      CHECK (status IN ('scheduled','confirmed','cancelled','completed','no_show')),
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ── followup_queue ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS followup_queue (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  day          int  NOT NULL,
  scheduled_at timestamptz NOT NULL,
  sent_at      timestamptz,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','sent','skipped','failed')),
  message      text,
  created_at   timestamptz DEFAULT now()
);

-- ── client_messages ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sender_id   uuid NOT NULL REFERENCES app_users(id),
  sender_type text NOT NULL CHECK (sender_type IN ('agency','client')),
  body        text NOT NULL,
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

-- ── client_notifications ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text,
  read_at    timestamptz,
  data       jsonb,
  created_at timestamptz DEFAULT now()
);

-- ── agent_actions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_actions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  action_type    text NOT NULL
                   CHECK (action_type IN ('send_message','cancel_appointment','reschedule','qualify_lead')),
  requested_by   uuid REFERENCES app_users(id),
  target_phone   text,
  appointment_id uuid REFERENCES appointments(id),
  lead_id        uuid REFERENCES leads(id),
  payload        jsonb,
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','done','failed')),
  result         jsonb,
  created_at     timestamptz DEFAULT now(),
  completed_at   timestamptz
);

-- ── job_queue ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_queue (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type     text NOT NULL,
  client_id    uuid REFERENCES clients(id),
  payload      jsonb NOT NULL DEFAULT '{}',
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','running','done','failed')),
  priority     int  DEFAULT 5,
  result       jsonb,
  error        text,
  created_at   timestamptz DEFAULT now(),
  started_at   timestamptz,
  completed_at timestamptz
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_queue       ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue            ENABLE ROW LEVEL SECURITY;

-- Helper: retorna o app_user do usuário autenticado
CREATE OR REPLACE FUNCTION current_app_user()
RETURNS app_users LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT * FROM app_users WHERE supabase_uid = auth.uid() LIMIT 1;
$$;

-- ── Policies: app_users ──────────────────────────────────────
CREATE POLICY "app_users: agency vê todos"
  ON app_users FOR SELECT
  USING ((current_app_user()).user_type IN ('agency_owner','agency_staff'));

CREATE POLICY "app_users: client vê seu próprio registro"
  ON app_users FOR SELECT
  USING (supabase_uid = auth.uid());

CREATE POLICY "app_users: agency_owner insere"
  ON app_users FOR INSERT
  WITH CHECK ((current_app_user()).user_type = 'agency_owner');

CREATE POLICY "app_users: agency_owner atualiza"
  ON app_users FOR UPDATE
  USING ((current_app_user()).user_type = 'agency_owner');

-- ── Policies: clients ────────────────────────────────────────
CREATE POLICY "clients: agency vê todos"
  ON clients FOR SELECT
  USING ((current_app_user()).user_type IN ('agency_owner','agency_staff'));

CREATE POLICY "clients: client vê o próprio"
  ON clients FOR SELECT
  USING (id = (current_app_user()).client_id);

CREATE POLICY "clients: agency_owner CRUD"
  ON clients FOR ALL
  USING ((current_app_user()).user_type = 'agency_owner');

-- ── Policies: leads ──────────────────────────────────────────
CREATE POLICY "leads: agency vê todos"
  ON leads FOR SELECT
  USING ((current_app_user()).user_type IN ('agency_owner','agency_staff'));

CREATE POLICY "leads: client vê os próprios"
  ON leads FOR SELECT
  USING (client_id = (current_app_user()).client_id);

CREATE POLICY "leads: agency CRUD"
  ON leads FOR ALL
  USING ((current_app_user()).user_type IN ('agency_owner','agency_staff'));

-- ── Policies: appointments ───────────────────────────────────
CREATE POLICY "appointments: agency vê todos"
  ON appointments FOR SELECT
  USING ((current_app_user()).user_type IN ('agency_owner','agency_staff'));

CREATE POLICY "appointments: client vê os próprios"
  ON appointments FOR SELECT
  USING (client_id = (current_app_user()).client_id);

CREATE POLICY "appointments: agency CRUD"
  ON appointments FOR ALL
  USING ((current_app_user()).user_type IN ('agency_owner','agency_staff'));

-- ── Policies: followup_queue ─────────────────────────────────
CREATE POLICY "followup: agency CRUD"
  ON followup_queue FOR ALL
  USING ((current_app_user()).user_type IN ('agency_owner','agency_staff'));

-- ── Policies: client_messages ────────────────────────────────
CREATE POLICY "messages: agency vê todos"
  ON client_messages FOR SELECT
  USING ((current_app_user()).user_type IN ('agency_owner','agency_staff'));

CREATE POLICY "messages: client vê os próprios"
  ON client_messages FOR SELECT
  USING (client_id = (current_app_user()).client_id);

CREATE POLICY "messages: agency insere"
  ON client_messages FOR INSERT
  WITH CHECK ((current_app_user()).user_type IN ('agency_owner','agency_staff'));

CREATE POLICY "messages: client insere"
  ON client_messages FOR INSERT
  WITH CHECK (client_id = (current_app_user()).client_id);

-- ── Policies: client_notifications ──────────────────────────
CREATE POLICY "notif: client vê as próprias"
  ON client_notifications FOR SELECT
  USING (client_id = (current_app_user()).client_id);

CREATE POLICY "notif: agency insere"
  ON client_notifications FOR INSERT
  WITH CHECK ((current_app_user()).user_type IN ('agency_owner','agency_staff'));

CREATE POLICY "notif: client marca como lida"
  ON client_notifications FOR UPDATE
  USING (client_id = (current_app_user()).client_id);

-- ── Policies: agent_actions ──────────────────────────────────
CREATE POLICY "agent_actions: agency vê todos"
  ON agent_actions FOR SELECT
  USING ((current_app_user()).user_type IN ('agency_owner','agency_staff'));

CREATE POLICY "agent_actions: client vê os próprios"
  ON agent_actions FOR SELECT
  USING (client_id = (current_app_user()).client_id);

CREATE POLICY "agent_actions: client_owner insere"
  ON agent_actions FOR INSERT
  WITH CHECK (
    client_id = (current_app_user()).client_id
    AND (current_app_user()).user_type = 'client_owner'
  );

CREATE POLICY "agent_actions: agency CRUD"
  ON agent_actions FOR ALL
  USING ((current_app_user()).user_type IN ('agency_owner','agency_staff'));

-- ── Policies: job_queue ──────────────────────────────────────
CREATE POLICY "job_queue: agency_owner CRUD"
  ON job_queue FOR ALL
  USING ((current_app_user()).user_type = 'agency_owner');

-- ============================================================
-- Realtime — tabelas que o dashboard vai assinar
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE client_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE client_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_actions;
