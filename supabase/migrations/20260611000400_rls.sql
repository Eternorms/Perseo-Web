-- ════════════════════════════════════════════════════════════════════════
-- Perseo Web — 0004 RLS + Realtime + notificações automáticas
--
-- Matriz de acesso:
--   agency_owner  → CRUD total (deletes sensíveis só owner)
--   agency_staff  → lê tudo, edita operacional
--   client_*      → somente linhas do próprio client_id
-- ════════════════════════════════════════════════════════════════════════

alter table public.clients              enable row level security;
alter table public.app_users            enable row level security;
alter table public.leads                enable row level security;
alter table public.appointments         enable row level security;
alter table public.followup_queue       enable row level security;
alter table public.funnel_stages        enable row level security;
alter table public.campaign_metrics     enable row level security;
alter table public.client_messages      enable row level security;
alter table public.client_notifications enable row level security;
alter table public.agent_actions        enable row level security;
alter table public.tasks                enable row level security;
alter table public.social_posts         enable row level security;
alter table public.job_queue            enable row level security;

-- ── clients ─────────────────────────────────────────────────────────────
create policy clients_select on public.clients for select to authenticated
  using ((select public.is_agency()) or id = (select public.current_client_id()));
create policy clients_insert on public.clients for insert to authenticated
  with check ((select public.is_agency()));
create policy clients_update on public.clients for update to authenticated
  using ((select public.is_agency()) or id = (select public.current_client_id()))
  with check ((select public.is_agency()) or id = (select public.current_client_id()));
create policy clients_delete on public.clients for delete to authenticated
  using ((select public.is_agency_owner()));

-- ── app_users ───────────────────────────────────────────────────────────
create policy app_users_select on public.app_users for select to authenticated
  using ((select public.is_agency()) or supabase_uid = (select auth.uid()));
create policy app_users_insert on public.app_users for insert to authenticated
  with check ((select public.is_agency_owner()));
create policy app_users_update on public.app_users for update to authenticated
  using ((select public.is_agency_owner()))
  with check ((select public.is_agency_owner()));
create policy app_users_delete on public.app_users for delete to authenticated
  using ((select public.is_agency_owner()));

-- ── leads ───────────────────────────────────────────────────────────────
create policy leads_select on public.leads for select to authenticated
  using ((select public.is_agency()) or client_id = (select public.current_client_id()));
create policy leads_write on public.leads for insert to authenticated
  with check ((select public.is_agency()));
create policy leads_update on public.leads for update to authenticated
  using ((select public.is_agency())) with check ((select public.is_agency()));
create policy leads_delete on public.leads for delete to authenticated
  using ((select public.is_agency()));

-- ── appointments (cliente confirma/cancela os próprios) ────────────────
create policy appointments_select on public.appointments for select to authenticated
  using ((select public.is_agency()) or client_id = (select public.current_client_id()));
create policy appointments_insert on public.appointments for insert to authenticated
  with check ((select public.is_agency()));
create policy appointments_update on public.appointments for update to authenticated
  using ((select public.is_agency()) or client_id = (select public.current_client_id()))
  with check ((select public.is_agency()) or client_id = (select public.current_client_id()));
create policy appointments_delete on public.appointments for delete to authenticated
  using ((select public.is_agency()));

-- ── followup_queue (interno da agência/automação) ──────────────────────
create policy followups_agency on public.followup_queue for all to authenticated
  using ((select public.is_agency())) with check ((select public.is_agency()));

-- ── funnel_stages ───────────────────────────────────────────────────────
create policy funnel_select on public.funnel_stages for select to authenticated
  using ((select public.is_agency()) or client_id = (select public.current_client_id()));
create policy funnel_write on public.funnel_stages for insert to authenticated
  with check ((select public.is_agency()));
create policy funnel_update on public.funnel_stages for update to authenticated
  using ((select public.is_agency())) with check ((select public.is_agency()));
create policy funnel_delete on public.funnel_stages for delete to authenticated
  using ((select public.is_agency()));

-- ── campaign_metrics ────────────────────────────────────────────────────
create policy metrics_select on public.campaign_metrics for select to authenticated
  using ((select public.is_agency()) or client_id = (select public.current_client_id()));
create policy metrics_write on public.campaign_metrics for insert to authenticated
  with check ((select public.is_agency()));
create policy metrics_update on public.campaign_metrics for update to authenticated
  using ((select public.is_agency())) with check ((select public.is_agency()));
create policy metrics_delete on public.campaign_metrics for delete to authenticated
  using ((select public.is_agency()));

-- ── client_messages (chat: cada lado escreve como si mesmo) ────────────
create policy messages_select on public.client_messages for select to authenticated
  using ((select public.is_agency()) or client_id = (select public.current_client_id()));
create policy messages_insert on public.client_messages for insert to authenticated
  with check (
    ((select public.is_agency()) and sender_type = 'agency')
    or (client_id = (select public.current_client_id()) and sender_type = 'client')
  );
create policy messages_update on public.client_messages for update to authenticated
  using ((select public.is_agency()) or client_id = (select public.current_client_id()))
  with check ((select public.is_agency()) or client_id = (select public.current_client_id()));
create policy messages_delete on public.client_messages for delete to authenticated
  using ((select public.is_agency_owner()));

-- ── client_notifications ────────────────────────────────────────────────
create policy notifications_select on public.client_notifications for select to authenticated
  using ((select public.is_agency()) or client_id = (select public.current_client_id()));
create policy notifications_insert on public.client_notifications for insert to authenticated
  with check ((select public.is_agency()));
create policy notifications_update on public.client_notifications for update to authenticated
  using ((select public.is_agency()) or client_id = (select public.current_client_id()))
  with check ((select public.is_agency()) or client_id = (select public.current_client_id()));
create policy notifications_delete on public.client_notifications for delete to authenticated
  using ((select public.is_agency()));

-- ── agent_actions (cliente pode solicitar; agência gerencia) ───────────
create policy agent_actions_select on public.agent_actions for select to authenticated
  using ((select public.is_agency()) or client_id = (select public.current_client_id()));
create policy agent_actions_insert on public.agent_actions for insert to authenticated
  with check ((select public.is_agency()) or client_id = (select public.current_client_id()));
create policy agent_actions_update on public.agent_actions for update to authenticated
  using ((select public.is_agency())) with check ((select public.is_agency()));
create policy agent_actions_delete on public.agent_actions for delete to authenticated
  using ((select public.is_agency_owner()));

-- ── tasks (kanban interno — só agência) ────────────────────────────────
create policy tasks_agency on public.tasks for all to authenticated
  using ((select public.is_agency())) with check ((select public.is_agency()));

-- ── social_posts ────────────────────────────────────────────────────────
create policy posts_select on public.social_posts for select to authenticated
  using ((select public.is_agency()) or client_id = (select public.current_client_id()));
create policy posts_write on public.social_posts for insert to authenticated
  with check ((select public.is_agency()));
create policy posts_update on public.social_posts for update to authenticated
  using ((select public.is_agency())) with check ((select public.is_agency()));
create policy posts_delete on public.social_posts for delete to authenticated
  using ((select public.is_agency()));

-- ── job_queue (interno) ─────────────────────────────────────────────────
create policy jobs_agency on public.job_queue for all to authenticated
  using ((select public.is_agency())) with check ((select public.is_agency()));

-- ── Realtime ────────────────────────────────────────────────────────────
alter table public.client_messages      replica identity full;
alter table public.client_notifications replica identity full;
alter table public.appointments         replica identity full;
alter table public.agent_actions        replica identity full;

alter publication supabase_realtime add table public.client_messages;
alter publication supabase_realtime add table public.client_notifications;
alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.agent_actions;

-- ── Notificação automática: novo agendamento ───────────────────────────
-- Regra de negócio: todo novo agendamento gera client_notifications,
-- independente de quem escreveu (web, agente de IA ou desktop).
create or replace function public.notify_new_appointment()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.client_notifications (client_id, type, title, body, data)
  values (
    new.client_id,
    'appointment',
    'Novo agendamento',
    coalesce(new.patient_name, 'Paciente') || ' — ' ||
      to_char(new.scheduled_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI'),
    jsonb_build_object('appointment_id', new.id, 'scheduled_at', new.scheduled_at)
  );
  return new;
end;
$$;

create trigger appointments_notify after insert on public.appointments
  for each row execute function public.notify_new_appointment();
