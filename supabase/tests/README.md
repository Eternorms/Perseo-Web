# Testes de RLS

## Estático (CI)

`rls.test.ts` roda na suíte Vitest e garante que nenhuma tabela nova entre sem
RLS/policies e que as regras críticas (chat, tabelas internas, realtime) não
regridam por edição de migration.

## Manual contra o banco (antes de cada release de schema)

No SQL Editor do Supabase, com dois usuários de teste (um `client_owner` do
cliente A e um do cliente B):

```sql
-- como cliente A (Dashboard → SQL com "Run as" ou via API com o JWT do usuário)
select count(*) from leads;                  -- só leads do cliente A
select count(*) from leads where client_id = '<ID_DO_CLIENTE_B>';  -- 0 linhas
insert into tasks (title) values ('x');      -- deve falhar (42501)
update clients set monthly_value = 0 where id = '<ID_DO_CLIENTE_B>'; -- 0 linhas
insert into client_messages (client_id, sender_type, body)
  values ('<ID_DO_CLIENTE_B>', 'client', 'oi');  -- deve falhar
```

Checklist: cliente não lê dados de outro cliente; cliente não escreve em
`tasks`/`job_queue`/`followup_queue`; agência (`agency_staff`) lê tudo mas não
deleta `clients` (somente owner).
