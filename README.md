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

## Deploy (Railway)

Build padrão Next (`npm run build` / `npm start`). Variáveis necessárias: ver `.env.example`. Sem segredos no repo; `SUPABASE_SERVICE_ROLE_KEY` jamais vai para o browser (apenas `src/lib/supabase/admin.ts`, marcado `server-only`).
