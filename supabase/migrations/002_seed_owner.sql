-- ============================================================
-- Seed: cria o agency_owner
-- Substituir os valores antes de rodar
-- ============================================================

-- 1. Criar o usuário no Supabase Auth
SELECT auth.create_user(
  '{"email": "SEU_EMAIL@exemplo.com", "password": "SUA_SENHA_FORTE", "email_confirm": true}'::jsonb
);

-- 2. Inserir na tabela app_users (rodar logo após o passo 1)
-- Substituir <UUID_GERADO> pelo id retornado acima, ou usar a subquery abaixo:
INSERT INTO app_users (supabase_uid, user_type, name, email)
SELECT id, 'agency_owner', 'Seu Nome', 'SEU_EMAIL@exemplo.com'
FROM auth.users
WHERE email = 'SEU_EMAIL@exemplo.com'
LIMIT 1;
