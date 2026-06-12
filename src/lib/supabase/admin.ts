import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PerseoSchema } from "@/types/perseo";

/** Database composto: schema `public` (nosso) + `perseo` (somente leitura). */
type AdminDatabase = Database & { perseo: PerseoSchema };

/**
 * Client com service_role — IGNORA RLS. Exclusivamente server-side:
 *  - leitura do schema `perseo` (+ a única escrita permitida: decisão de aprovação)
 *  - convites de usuário (auth.admin)
 *  - captura de lead do site público
 * Jamais importar em client component (`server-only` garante em build).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error("Supabase admin não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createSupabaseClient<AdminDatabase>(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Acesso tipado ao schema `perseo` (engine de produção — desktop é o dono). */
export function perseoDb() {
  return createAdminClient().schema("perseo");
}

/** true quando as envs do admin existem e são válidas (páginas degradam com elegância sem elas). */
export function adminConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && process.env.SUPABASE_SERVICE_ROLE_KEY && URL.canParse(url));
}
