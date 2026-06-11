-- ════════════════════════════════════════════════════════════════════════
-- Perseo Web — 0003 operação: chat, notificações, agente, tarefas,
-- postagens e fila de jobs
-- ════════════════════════════════════════════════════════════════════════

-- ── client_messages (chat agência ⇄ cliente) ───────────────────────────
create table public.client_messages (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients (id) on delete cascade,
  sender_id   uuid references public.app_users (id) on delete set null,
  sender_type text not null check (sender_type in ('agency','client')),
  body        text not null check (length(body) between 1 and 4000),
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index client_messages_client_time_idx on public.client_messages (client_id, created_at desc);
create index client_messages_unread_idx on public.client_messages (client_id) where read_at is null;

-- ── client_notifications ────────────────────────────────────────────────
create table public.client_notifications (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients (id) on delete cascade,
  type       text not null default 'general',
  title      text not null,
  body       text,
  read_at    timestamptz,
  data       jsonb,
  created_at timestamptz not null default now()
);

create index client_notifications_client_idx on public.client_notifications (client_id, created_at desc);

-- ── agent_actions (ações solicitadas ao agente de IA) ──────────────────
create table public.agent_actions (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients (id) on delete cascade,
  action_type  text not null
                 check (action_type in ('send_message','cancel_appointment','reschedule','qualify_lead')),
  requested_by uuid references public.app_users (id) on delete set null,
  payload      jsonb,
  status       text not null default 'pending'
                 check (status in ('pending','approved','executed','failed','cancelled')),
  result       jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger agent_actions_updated_at before update on public.agent_actions
  for each row execute function public.set_updated_at();

create index agent_actions_client_idx on public.agent_actions (client_id, created_at desc);
create index agent_actions_status_idx on public.agent_actions (status) where status = 'pending';

-- ── tasks (kanban interno da agência) ──────────────────────────────────
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  status      text not null default 'backlog'
                check (status in ('backlog','todo','in_progress','review','done')),
  priority    text not null default 'medium' check (priority in ('low','medium','high')),
  client_id   uuid references public.clients (id) on delete set null,
  assigned_to uuid references public.app_users (id) on delete set null,
  created_by  uuid references public.app_users (id) on delete set null,
  due_date    date,
  position    double precision not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

create index tasks_board_idx on public.tasks (status, position);
create index tasks_client_idx on public.tasks (client_id);

-- ── social_posts (agendamento de postagens) ────────────────────────────
create table public.social_posts (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients (id) on delete cascade,
  platform     text not null default 'instagram' check (platform in ('instagram','facebook','tiktok')),
  caption      text,
  media_url    text,
  media_type   text check (media_type in ('image','video')),
  scheduled_at timestamptz,
  status       text not null default 'draft' check (status in ('draft','scheduled','published','failed')),
  meta_post_id text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger social_posts_updated_at before update on public.social_posts
  for each row execute function public.set_updated_at();

create index social_posts_client_idx on public.social_posts (client_id, scheduled_at);
create index social_posts_due_idx on public.social_posts (status, scheduled_at) where status = 'scheduled';

-- ── job_queue (integração com pipeline/automações) ─────────────────────
create table public.job_queue (
  id         uuid primary key default gen_random_uuid(),
  job_type   text not null,
  client_id  uuid references public.clients (id) on delete cascade,
  payload    jsonb,
  status     text not null default 'pending' check (status in ('pending','running','done','failed')),
  priority   int not null default 5,
  result     jsonb,
  error      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger job_queue_updated_at before update on public.job_queue
  for each row execute function public.set_updated_at();

create index job_queue_pending_idx on public.job_queue (status, priority, created_at);
