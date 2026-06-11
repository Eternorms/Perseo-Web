-- ════════════════════════════════════════════════════════════════════════
-- Perseo Web — 0002 CRM: leads, appointments, followups, funil, métricas
-- ════════════════════════════════════════════════════════════════════════

-- ── leads ───────────────────────────────────────────────────────────────
create table public.leads (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references public.clients (id) on delete cascade,
  name                  text,
  phone                 text,
  email                 text,
  source                text default 'meta_lead_form',
  status                text not null default 'new'
                          check (status in ('new','contacted','qualified','scheduled','converted','lost')),
  meta_lead_id          text,
  first_contact_at      timestamptz,
  response_time_seconds int,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

create index leads_client_status_idx on public.leads (client_id, status);
create index leads_created_idx on public.leads (created_at desc);
create unique index leads_meta_lead_idx on public.leads (meta_lead_id) where meta_lead_id is not null;

-- ── appointments ────────────────────────────────────────────────────────
create table public.appointments (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients (id) on delete cascade,
  lead_id           uuid references public.leads (id) on delete set null,
  patient_name      text not null,
  patient_phone     text,
  scheduled_at      timestamptz not null,
  calendar_event_id text,
  status            text not null default 'scheduled'
                      check (status in ('scheduled','confirmed','cancelled','completed','no_show')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger appointments_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();

create index appointments_client_time_idx on public.appointments (client_id, scheduled_at);
create index appointments_time_idx on public.appointments (scheduled_at);

-- ── followup_queue ──────────────────────────────────────────────────────
create table public.followup_queue (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references public.leads (id) on delete cascade,
  client_id    uuid not null references public.clients (id) on delete cascade,
  day          int not null default 1,
  scheduled_at timestamptz not null,
  sent_at      timestamptz,
  status       text not null default 'pending' check (status in ('pending','sent','cancelled')),
  message      text,
  created_at   timestamptz not null default now()
);

create index followup_queue_due_idx on public.followup_queue (status, scheduled_at);
create index followup_queue_client_idx on public.followup_queue (client_id);

-- ── funnel_stages (estágios customizáveis do funil por cliente) ────────
create table public.funnel_stages (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients (id) on delete cascade,
  value      text not null,
  label      text not null,
  color      text,
  position   int not null default 0,
  created_at timestamptz not null default now(),
  unique (client_id, value)
);

create index funnel_stages_client_idx on public.funnel_stages (client_id, position);

-- ── campaign_metrics (séries diárias por plataforma) ───────────────────
create table public.campaign_metrics (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients (id) on delete cascade,
  date        date not null,
  platform    text not null default 'meta',
  impressions bigint not null default 0,
  reach       bigint not null default 0,
  clicks      bigint not null default 0,
  leads       int not null default 0,
  spend       numeric(12,2) not null default 0,
  cpl         numeric(12,2),
  created_at  timestamptz not null default now(),
  unique (client_id, date, platform)
);

create index campaign_metrics_client_date_idx on public.campaign_metrics (client_id, date desc);
