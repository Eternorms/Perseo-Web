-- Perseo Agency — deals (funil de aquisição da PRÓPRIA agência).
-- identified → ... → won/lost. Distinto de `leads` (pacientes DE CADA cliente).

create table public.deals (
  id                   uuid primary key default gen_random_uuid(),
  business_name        text not null,
  contact_name         text,
  contact_email        text,
  contact_phone        text,
  niche                text,
  source               text default 'outbound',
  stage                text not null default 'identified'
                         check (stage in ('identified','warmed','conversation','audit','proposal','negotiation','won','lost')),
  estimated_value      numeric(10,2),
  teardown_url         text,
  notes                text,
  lost_reason          text,
  owner_id             uuid references public.app_users (id) on delete set null,
  converted_client_id  uuid references public.clients (id) on delete set null,
  last_contact_at      timestamptz,
  created_by           uuid not null references public.app_users (id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index deals_stage_idx on public.deals (stage);

alter table public.deals enable row level security;

-- Funil interno da agência: só a equipe da agência enxerga/edita.
create policy "deals: agency CRUD"
  on public.deals for all
  using ((public.current_app_user()).user_type in ('agency_owner','agency_staff'));
