import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guarda estática de segurança: TODA tabela criada nas migrations precisa de
 * RLS habilitada e de policies; cliente nunca pode ter policy de escrita em
 * tabelas internas. Complementa o teste manual com dois usuários (ver
 * supabase/tests/README.md).
 */

const dir = join(__dirname, "..", "migrations");
const sql = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(join(dir, f), "utf8"))
  .join("\n");

const createdTables = [...sql.matchAll(/create table (?:if not exists )?public\.(\w+)/gi)].map((m) => m[1]);

describe("RLS — cobertura total do schema public", () => {
  it("migrations criam as 13 tabelas do produto", () => {
    expect(new Set(createdTables)).toEqual(
      new Set([
        "clients",
        "app_users",
        "leads",
        "appointments",
        "followup_queue",
        "funnel_stages",
        "campaign_metrics",
        "client_messages",
        "client_notifications",
        "agent_actions",
        "tasks",
        "social_posts",
        "job_queue",
      ]),
    );
  });

  it.each(createdTables)("tabela %s tem RLS habilitada", (table) => {
    expect(sql).toMatch(new RegExp(`alter table public\\.${table}\\s+enable row level security`, "i"));
  });

  it.each(createdTables)("tabela %s tem ao menos uma policy", (table) => {
    expect(sql).toMatch(new RegExp(`create policy \\w+ on public\\.${table}`, "i"));
  });

  it("funções de autorização são SECURITY DEFINER com search_path fixo", () => {
    for (const fn of ["current_app_user", "current_client_id", "is_agency", "is_agency_owner"]) {
      const def = new RegExp(`function public\\.${fn}\\(\\)[\\s\\S]*?security definer[\\s\\S]*?set search_path = public`, "i");
      expect(sql).toMatch(def);
    }
  });

  it("tabelas internas (tasks, job_queue, followup_queue) são só-agência", () => {
    for (const table of ["tasks", "job_queue", "followup_queue"]) {
      const policies = [...sql.matchAll(new RegExp(`create policy \\w+ on public\\.${table}[\\s\\S]*?;`, "gi"))].map((m) => m[0]);
      expect(policies.length).toBeGreaterThan(0);
      for (const p of policies) {
        expect(p).not.toMatch(/current_client_id/);
        expect(p).toMatch(/is_agency/);
      }
    }
  });

  it("chat: cliente só insere como sender_type=client da própria conta", () => {
    const policy = sql.match(/create policy messages_insert on public\.client_messages[\s\S]*?;/i)?.[0] ?? "";
    expect(policy).toMatch(/sender_type = 'client'/);
    expect(policy).toMatch(/client_id = \(select public\.current_client_id\(\)\)/);
  });

  it("realtime publicado nas 4 tabelas exigidas", () => {
    for (const table of ["client_messages", "client_notifications", "appointments", "agent_actions"]) {
      expect(sql).toMatch(new RegExp(`alter publication supabase_realtime add table public\\.${table}`, "i"));
    }
  });

  it("novo agendamento gera notificação via trigger", () => {
    expect(sql).toMatch(/create trigger appointments_notify after insert on public\.appointments/i);
  });
});
