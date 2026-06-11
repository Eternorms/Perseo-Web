-- ════════════════════════════════════════════════════════════════════════
-- Perseo Web — 0001 core: clients, app_users, funções de autorização
-- Schema `public` (bounded context deste app). O schema `perseo` pertence
-- ao desktop "Perseo Produção" e NÃO é tocado por estas migrations.
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── trigger util: updated_at ────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── clients ─────────────────────────────────────────────────────────────
create table public.clients (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  business_name     text not null default '',
  niche             text,
  status            text not null default 'onboarding'
                      check (status in ('onboarding','active','paused','churned')),
  onboarding_step   int  not null default 1 check (onboarding_step between 1 and 7),
  -- WhatsApp
  whatsapp_type     text check (whatsapp_type in ('evolution','meta')),
  whatsapp_instance text,
  whatsapp_phone    text,
  -- Meta Ads
  meta_page_id      text,
  meta_form_id      text,
  ig_page_id        text,
  meta_token        text,
  -- Google Calendar
  calendar_id       text,
  -- Ponte para o engine de produção (perseo.clients.id)
  perseo_client_id  bigint unique,
  -- Agente de IA
  agent_prompt      text,
  agent_active      boolean not null default false,
  -- Comercial
  plan              text default 'starter',
  services          text[] not null default '{}',
  monthly_value     numeric(10,2),
  -- Contato principal
  contact_name      text,
  contact_phone     text,
  contact_email     text,
  -- Qualificação vinda da captura de lead do site (faturamento, origem…)
  intake            jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

create index clients_status_idx on public.clients (status);

-- ── app_users (auth.users → papel + vínculo de cliente) ────────────────
create table public.app_users (
  id           uuid primary key default gen_random_uuid(),
  supabase_uid uuid not null unique references auth.users (id) on delete cascade,
  user_type    text not null
                 check (user_type in ('agency_owner','agency_staff','client_owner','client_staff')),
  client_id    uuid references public.clients (id) on delete set null,
  name         text not null default '',
  email        text not null default '',
  created_at   timestamptz not null default now(),
  -- usuário de cliente precisa de vínculo; usuário de agência não tem
  constraint app_users_client_link check (
    (user_type in ('agency_owner','agency_staff') and client_id is null)
    or (user_type in ('client_owner','client_staff') and client_id is not null)
  )
);

create index app_users_client_idx on public.app_users (client_id);

-- ── funções de autorização (SECURITY DEFINER: não recursam em RLS) ─────
create or replace function public.current_app_user()
returns public.app_users
language sql stable security definer
set search_path = public
as $$
  select * from public.app_users where supabase_uid = (select auth.uid()) limit 1;
$$;

create or replace function public.current_client_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select client_id from public.app_users where supabase_uid = (select auth.uid()) limit 1;
$$;

create or replace function public.is_agency()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_users
    where supabase_uid = (select auth.uid())
      and user_type in ('agency_owner','agency_staff')
  );
$$;

create or replace function public.is_agency_owner()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_users
    where supabase_uid = (select auth.uid())
      and user_type = 'agency_owner'
  );
$$;

revoke execute on function public.current_app_user() from anon;
revoke execute on function public.current_client_id() from anon;
revoke execute on function public.is_agency() from anon;
revoke execute on function public.is_agency_owner() from anon;
