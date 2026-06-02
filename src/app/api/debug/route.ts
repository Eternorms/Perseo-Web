import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const info: Record<string, unknown> = {
    url_set: !!url,
    url_value: url ? `${url.slice(0, 30)}...` : null,
    url_length: url?.length,
    key_set: !!key,
    key_prefix: key ? key.slice(0, 15) : null,
  }

  if (url) {
    try {
      const res = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: key ?? '' },
      })
      info.supabase_reachable = true
      info.supabase_status = res.status
    } catch (e: unknown) {
      info.supabase_reachable = false
      info.supabase_error = e instanceof Error ? e.message : String(e)
      if (e instanceof Error && (e as NodeJS.ErrnoException).cause) {
        const cause = (e as NodeJS.ErrnoException).cause as Error
        info.supabase_error_cause = cause?.message ?? String(cause)
        info.supabase_error_code = (cause as NodeJS.ErrnoException)?.code
      }
    }
  }

  return NextResponse.json(info)
}
