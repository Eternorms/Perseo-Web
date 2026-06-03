-- ============================================================
-- Perseo Agency — tasks + assistant_messages
-- Rodar no Supabase SQL Editor
-- ============================================================

-- ── tasks ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'backlog'
                CHECK (status IN ('backlog','todo','in_progress','review','done')),
  priority    text DEFAULT 'medium'
                CHECK (priority IN ('low','medium','high')),
  client_id   uuid REFERENCES clients(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_by  uuid NOT NULL REFERENCES app_users(id),
  due_date    timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks: agency CRUD"
  ON tasks FOR ALL
  USING ((current_app_user()).user_type IN ('agency_owner','agency_staff'));

-- ── assistant_messages ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assistant_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role       text NOT NULL CHECK (role IN ('user','assistant')),
  content    text NOT NULL,
  metadata   jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant: agency only"
  ON assistant_messages FOR ALL
  USING ((current_app_user()).user_type IN ('agency_owner','agency_staff'));
