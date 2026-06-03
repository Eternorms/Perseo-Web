'use client'

import { useState } from 'react'

interface UGCScript {
  title: string
  hook: string
  body: string
  cta: string
}

interface Analysis {
  hooks: string[]
  ctas: string[]
  promises: string[]
  tone: string
  insights: string[]
  ugc_scripts: UGCScript[]
}

interface AdResult {
  id: string
  page_name?: string
  ad_snapshot_url?: string
}

interface ResearchResult {
  ads: AdResult[]
  analysis: Analysis | null
  message: string | null
  error?: string
}

type State = 'idle' | 'loading' | 'results' | 'error'

const COUNTRIES = [
  { code: 'BR', label: 'Brasil' },
  { code: 'PT', label: 'Portugal' },
  { code: 'US', label: 'Estados Unidos' },
  { code: 'AR', label: 'Argentina' },
]

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 bg-neutral-800 border border-neutral-700 rounded-lg text-xs text-neutral-300">
      {children}
    </span>
  )
}

export default function ResearchTool() {
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [errMsg, setErrMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const searchTerm = fd.get('searchTerm') as string
    const niche = fd.get('niche') as string
    const country = fd.get('country') as string

    setState('loading')
    setResult(null)
    setErrMsg('')

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm, niche, country }),
      })
      const data: ResearchResult = await res.json()
      if (!res.ok || data.error) {
        setErrMsg(data.error ?? 'Erro ao processar pesquisa.')
        setState('error')
        return
      }
      setResult(data)
      setState('results')
    } catch {
      setErrMsg('Erro de rede. Tente novamente.')
      setState('error')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs text-neutral-400 uppercase tracking-wide">Marca ou palavra-chave</label>
            <input
              name="searchTerm"
              required
              placeholder='Ex: "botox", "harmonização facial"'
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-400 uppercase tracking-wide">País</label>
            <select
              name="country"
              defaultValue="BR"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-500"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs text-neutral-400 uppercase tracking-wide">Nicho (opcional)</label>
            <input
              name="niche"
              placeholder='Ex: "estética", "dermatologia", "odontologia"'
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={state === 'loading'}
          className="px-5 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50"
        >
          {state === 'loading' ? 'Analisando...' : 'Analisar concorrentes'}
        </button>
      </form>

      {/* Loading */}
      {state === 'loading' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
          <p className="text-sm text-neutral-500">Buscando anúncios e analisando com Claude...</p>
          <p className="text-xs text-neutral-600">Pode levar 10-20 segundos</p>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="bg-red-950 border border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-400">{errMsg}</p>
        </div>
      )}

      {/* Results */}
      {state === 'results' && result && (
        <div className="space-y-5">
          {/* Message when no ads */}
          {result.message && !result.analysis && (
            <div className="bg-amber-950 border border-amber-800 rounded-xl p-4">
              <p className="text-sm text-amber-400">{result.message}</p>
            </div>
          )}

          {/* Analysis */}
          {result.analysis && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  {result.ads.length} anúncios analisados
                  {result.message ? ` — ${result.message}` : ''}
                </p>
              </div>

              {/* Copy analysis */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
                <h2 className="text-sm font-medium text-white">Análise de copy</h2>

                {result.analysis.tone && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">Tom predominante</p>
                    <p className="text-sm text-neutral-300">{result.analysis.tone}</p>
                  </div>
                )}

                {result.analysis.hooks?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">Hooks recorrentes</p>
                    <div className="flex flex-wrap gap-2">
                      {result.analysis.hooks.map((h, i) => <Tag key={i}>{h}</Tag>)}
                    </div>
                  </div>
                )}

                {result.analysis.promises?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">Promessas de oferta</p>
                    <div className="flex flex-wrap gap-2">
                      {result.analysis.promises.map((p, i) => <Tag key={i}>{p}</Tag>)}
                    </div>
                  </div>
                )}

                {result.analysis.ctas?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">CTAs usados</p>
                    <div className="flex flex-wrap gap-2">
                      {result.analysis.ctas.map((c, i) => <Tag key={i}>{c}</Tag>)}
                    </div>
                  </div>
                )}

                {result.analysis.insights?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">Insights estratégicos</p>
                    <ul className="space-y-1">
                      {result.analysis.insights.map((ins, i) => (
                        <li key={i} className="text-sm text-neutral-300 flex gap-2">
                          <span className="text-neutral-600 shrink-0">·</span>
                          {ins}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* UGC Scripts */}
              {result.analysis.ugc_scripts?.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-medium text-white">Roteiros UGC gerados</h2>
                  {result.analysis.ugc_scripts.map((script, i) => (
                    <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{script.title}</p>
                      <div className="space-y-2">
                        <div className="space-y-0.5">
                          <p className="text-xs text-neutral-600">Hook (abertura)</p>
                          <p className="text-sm text-white font-medium">&ldquo;{script.hook}&rdquo;</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-neutral-600">Desenvolvimento</p>
                          <p className="text-sm text-neutral-300">{script.body}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-neutral-600">CTA</p>
                          <p className="text-sm text-neutral-300">{script.cta}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Source ads */}
              {result.ads.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-medium text-neutral-500">Anúncios fonte</h2>
                  <div className="flex flex-wrap gap-2">
                    {result.ads.map(ad => (
                      ad.ad_snapshot_url ? (
                        <a
                          key={ad.id}
                          href={ad.ad_snapshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-500 hover:text-white hover:border-neutral-600 transition-colors"
                        >
                          {ad.page_name ?? ad.id} ↗
                        </a>
                      ) : null
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
