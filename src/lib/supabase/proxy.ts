import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/agency", "/client", "/onboarding"];

/**
 * Mantém a sessão Supabase viva (refresh de token via cookies) e faz o
 * gate otimista de autenticação. Autorização por papel acontece na DAL
 * (layouts de /agency e /client) — aqui só checamos presença de sessão,
 * sem tocar no banco.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || !URL.canParse(url)) {
    // Sem envs válidas (ex.: preview sem secrets, URL sem https://) o gate
    // fica por conta da DAL, que redireciona qualquer rota protegida para
    // /login. Nunca derrubar o site público por configuração.
    if (url && !URL.canParse(url)) {
      console.error(`[proxy] NEXT_PUBLIC_SUPABASE_URL inválida ("${url}") — esperado https://<ref>.supabase.co`);
    }
    return response;
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  let isAuthenticated = false;
  try {
    // Verificação local do JWT. Com chaves assimétricas (RS256) pode buscar
    // JWKS na primeira chamada — try/catch impede que uma falha de rede
    // derrube o proxy e retorne 500 para rotas públicas.
    const { data } = await supabase.auth.getClaims();
    isAuthenticated = Boolean(data?.claims?.sub);
  } catch {
    // Em caso de falha (timeout JWKS, rede, etc.) o proxy passa a requisição
    // adiante; a DAL rejeita acessos protegidos na camada de autorização.
  }

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  if (isProtected && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
