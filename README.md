# Perseo Web

Plataforma da Perseo — agência de marketing AI-first para D2C/e-commerce. Três superfícies em um único app Next.js:

1. **Site público** (`/`) — landing premium + captura de lead.
2. **Dashboard da agência** (`/agency/*`) — CRM, kanban, agenda, funis, criativos, posts, inbox, time e os 4 dashboards internos (analytics, studio, finance, intelligence).
3. **Portal do cliente** (`/client/*`) — resultados, aprovação de criativos, agendamentos, chat e relatórios.

## Stack

- Next.js 16 (App Router, Turbopack, `proxy.ts`) + React 19 + TypeScript
- Tailwind CSS 4 (tokens em `src/app/globals.css`) + kit próprio de componentes (Base UI)
- Supabase (Postgres + Auth + Realtime) via `@supabase/ssr`
- Vitest + Testing Library

## Arquitetura de dados

Um único Postgres com dois bounded contexts:

| Schema   | Dono                      | Acesso deste app                                  |
| -------- | ------------------------- | ------------------------------------------------- |
| `public` | Perseo Web                | leitura/escrita com RLS (sessão do usuário)        |
| `perseo` | Perseo Produção (desktop) | somente leitura via service role; única escrita permitida: decisão de aprovação em `creative_approvals` |

Ponte entre contextos: `public.clients.perseo_client_id → perseo.clients.id` (preenchida no detalhe do cliente na agência).

## Rodando local

```bash
cp .env.example .env.local   # preencha com as chaves do projeto Supabase
npm install
npm run dev
```

Migrations do schema `public` em `supabase/migrations/` (aplicar em ordem no SQL Editor ou via `supabase db push`). Bootstrap do primeiro usuário da agência: ver `supabase/seed.sql`.

## Scripts

| Comando             | O que faz                       |
| ------------------- | ------------------------------- |
| `npm run dev`       | dev server (Turbopack)          |
| `npm run build`     | build de produção               |
| `npm run lint`      | ESLint                          |
| `npm run typecheck` | `tsc --noEmit`                  |
| `npm test`          | suite Vitest (smoke + unidade)  |

## Testes

78 testes cobrem o núcleo de negócio e as telas críticas:

- **Métricas** — ROAS ajustado por fraude, agregação ponderada por spend, funil cumulativo, MRR/churn.
- **Validações** — onboarding (7 steps), captura de lead (honeypot), anti open-redirect no `?next=`.
- **Ponte perseo** — `decideCreativeAction`: autorização por `perseo_client_id`, feedback obrigatório em revisão/rejeição, notificação gerada (única escrita permitida no schema do engine).
- **Agente** — cliente só solicita sobre os próprios agendamentos, reagendamento exige data futura, transições de status restritas à agência e validadas (`pending → approved → executed`).
- **RLS (estático)** — toda tabela com RLS + policies, tabelas internas só-agência, realtime publicado nas 4 tabelas exigidas. Roteiro manual com dois usuários em `supabase/tests/README.md`.
- **Smoke de UI** — login (senha + OAuth + `?next=`), wizard de onboarding (obrigatório vs. pulável, revisão), form de cliente (campo da ponte, exclusão só-owner).

## Deploy (Railway)

Build padrão Next (`npm run build` / `npm start`). Variáveis necessárias: ver `.env.example`. Sem segredos no repo; `SUPABASE_SERVICE_ROLE_KEY` jamais vai para o browser (apenas `src/lib/supabase/admin.ts`, marcado `server-only`).

## Go-live (runbook)

Ordem testada em produção:

1. **Supabase** — criar projeto; em *Settings → API* copiar Project URL, `anon` e `service_role`.
2. **Migrations** — rodar os 4 arquivos de `supabase/migrations/` em ordem no SQL Editor (ou `supabase db push`). Se o projeto tiver schema antigo, resetar antes (drop das tabelas do `public` — `auth` e `perseo` ficam intactos).
3. **Owner** — criar o usuário em *Authentication → Users* (Auto Confirm) e rodar o insert de `supabase/seed.sql` com o e-mail dele.
4. **Auth URLs** — *Authentication → URL Configuration*: Site URL = domínio público; Redirect URLs com `/auth/callback` (produção e localhost). Obrigatório para convites e OAuth.
5. **Railway** — Source na branch `main` com Root Directory **vazio** (raiz); definir as 4 variáveis de `.env.example`; domínio custom com Cloudflare em SSL **Full**.
6. **Smoke** — landing → formulário de lead cria `clients` em onboarding → login do owner cai em `/agency/dashboard`.
7. **RLS viva** — com o primeiro cliente real, rodar o roteiro de dois usuários em `supabase/tests/README.md`.
