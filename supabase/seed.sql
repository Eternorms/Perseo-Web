-- ════════════════════════════════════════════════════════════════════════
-- Perseo Web — bootstrap + seed de DESENVOLVIMENTO
--
-- ⚠ Nada aqui roda em produção automaticamente. O app não usa mock em
--   telas de produção: estados vazios são reais.
--
-- 1) BOOTSTRAP DO OWNER (obrigatório, prod e dev)
--    a. Crie o usuário no Supabase Dashboard → Authentication → Add user
--       (ou convide via /agency/team depois do primeiro owner existir).
--    b. Rode o insert abaixo trocando o e-mail:
-- ════════════════════════════════════════════════════════════════════════

insert into public.app_users (supabase_uid, user_type, name, email)
select id, 'agency_owner', coalesce(raw_user_meta_data->>'name', 'Operador Perseo'), email
from auth.users
where email = 'OWNER_EMAIL_AQUI@perseo.agency'
on conflict (supabase_uid) do update set user_type = 'agency_owner';

-- ════════════════════════════════════════════════════════════════════════
-- 2) SEED DE DEV (opcional — apenas ambiente local/staging)
--    Descomente o bloco para popular um cliente demo com leads,
--    agendamentos e métricas e validar as telas com dados realistas.
-- ════════════════════════════════════════════════════════════════════════

-- do $$
-- declare
--   v_client uuid;
-- begin
--   insert into public.clients
--     (name, business_name, niche, status, onboarding_step, plan, services, monthly_value,
--      contact_name, contact_email, contact_phone, whatsapp_type, agent_active)
--   values
--     ('Vora Skincare', 'Vora Cosméticos LTDA', 'beauty', 'active', 7, 'growth',
--      array['traffic','content'], 9500.00, 'Marina Costa', 'marina@vora.com.br',
--      '+5511988887777', 'evolution', true)
--   returning id into v_client;
--
--   insert into public.funnel_stages (client_id, value, label, color, position) values
--     (v_client, 'new',       'Novo',        '#5BA3FF', 0),
--     (v_client, 'contacted', 'Contatado',   '#8C93A3', 1),
--     (v_client, 'qualified', 'Qualificado', '#FFC857', 2),
--     (v_client, 'scheduled', 'Agendado',    '#5BA3FF', 3),
--     (v_client, 'converted', 'Convertido',  '#00FF41', 4);
--
--   insert into public.leads (client_id, name, phone, status, source, created_at) values
--     (v_client, 'Ana Souza',     '+5511911110001', 'converted', 'meta_lead_form', now() - interval '6 days'),
--     (v_client, 'Bruno Lima',    '+5511911110002', 'scheduled', 'meta_lead_form', now() - interval '4 days'),
--     (v_client, 'Carla Mendes',  '+5511911110003', 'qualified', 'meta_lead_form', now() - interval '3 days'),
--     (v_client, 'Diego Alves',   '+5511911110004', 'contacted', 'meta_lead_form', now() - interval '2 days'),
--     (v_client, 'Elisa Rocha',   '+5511911110005', 'new',       'meta_lead_form', now() - interval '1 day'),
--     (v_client, 'Fábio Nunes',   '+5511911110006', 'lost',      'meta_lead_form', now() - interval '5 days');
--
--   insert into public.appointments (client_id, patient_name, patient_phone, scheduled_at, status) values
--     (v_client, 'Ana Souza',  '+5511911110001', now() + interval '1 day',  'confirmed'),
--     (v_client, 'Bruno Lima', '+5511911110002', now() + interval '3 days', 'scheduled');
--
--   insert into public.campaign_metrics (client_id, date, platform, impressions, reach, clicks, leads, spend, cpl)
--   select v_client, (current_date - s)::date, 'meta',
--          18000 + (random()*9000)::int, 12000 + (random()*5000)::int,
--          420 + (random()*260)::int, 6 + (random()*9)::int,
--          240 + (random()*160)::numeric(12,2), 28 + (random()*22)::numeric(12,2)
--   from generate_series(0, 27) s;
-- end $$;
