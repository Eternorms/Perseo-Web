import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

interface MetaAd {
  id: string
  page_name?: string
  ad_snapshot_url?: string
  ad_creative_bodies?: string[]
  ad_creative_link_titles?: string[]
  ad_creative_link_descriptions?: string[]
}

interface UGCScript {
  title: string
  hook: string
  body: string
  cta: string
}

interface ClaudeAnalysis {
  hooks: string[]
  ctas: string[]
  promises: string[]
  tone: string
  insights: string[]
  ugc_scripts: UGCScript[]
}

export async function POST(req: NextRequest) {
  const token = process.env.FACEBOOK_APP_TOKEN
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!token) {
    return NextResponse.json({ error: 'FACEBOOK_APP_TOKEN não configurado no Railway.' }, { status: 500 })
  }
  if (!anthropicKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurado no Railway.' }, { status: 500 })
  }

  let body: { searchTerm?: string; niche?: string; country?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  const searchTerm = (body.searchTerm ?? '').trim()
  const niche = (body.niche ?? '').trim()
  const country = (body.country ?? 'BR').trim()

  if (!searchTerm) {
    return NextResponse.json({ error: 'searchTerm é obrigatório.' }, { status: 400 })
  }

  // 1. Buscar anúncios na Meta Ads Library
  const fields = [
    'id', 'page_name', 'ad_snapshot_url',
    'ad_creative_bodies', 'ad_creative_link_titles', 'ad_creative_link_descriptions',
  ].join(',')

  const params = new URLSearchParams({
    search_terms: searchTerm,
    ad_reached_countries: JSON.stringify([country]),
    ad_type: 'ALL',
    fields,
    limit: '25',
    access_token: token,
  })

  let ads: MetaAd[] = []
  try {
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/ads_archive?${params.toString()}`,
      { next: { revalidate: 0 } }
    )
    const metaData = await metaRes.json()
    if (metaData.error) {
      return NextResponse.json(
        { error: `Meta Ads Library: ${metaData.error.message}` },
        { status: 502 }
      )
    }
    ads = (metaData.data ?? []) as MetaAd[]
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao acessar Meta Ads Library.' }, { status: 502 })
  }

  if (ads.length === 0) {
    return NextResponse.json({
      ads: [],
      analysis: null,
      message: `Nenhum anúncio ativo encontrado para "${searchTerm}" no país ${country}. Tente outro termo.`,
    })
  }

  // 2. Extrair textos dos anúncios
  const adTexts = ads.map((ad, i) => {
    const parts: string[] = [`[Anúncio ${i + 1} — ${ad.page_name ?? 'desconhecido'}]`]
    if (ad.ad_creative_bodies?.length) parts.push(`Texto: ${ad.ad_creative_bodies.join(' | ')}`)
    if (ad.ad_creative_link_titles?.length) parts.push(`Título: ${ad.ad_creative_link_titles.join(' | ')}`)
    if (ad.ad_creative_link_descriptions?.length) parts.push(`Descrição: ${ad.ad_creative_link_descriptions.join(' | ')}`)
    return parts.join('\n')
  }).join('\n\n')

  // 3. Análise Claude
  const nicheContext = niche ? ` no nicho "${niche}"` : ''
  const prompt = `Você é um especialista em UGC Ads para Meta (Facebook/Instagram), especializado em clínicas e negócios de saúde e bem-estar.

Analise estes ${ads.length} anúncios ativos de concorrentes${nicheContext} em busca de "${searchTerm}":

${adTexts}

Responda APENAS com JSON válido no formato abaixo (sem markdown, sem explicações):
{
  "hooks": ["hook 1", "hook 2", "hook 3"],
  "ctas": ["CTA 1", "CTA 2", "CTA 3"],
  "promises": ["promessa 1", "promessa 2", "promessa 3"],
  "tone": "descrição do tom predominante nos anúncios",
  "insights": ["insight estratégico 1", "insight 2", "insight 3"],
  "ugc_scripts": [
    {
      "title": "Roteiro 1 — [abordagem usada]",
      "hook": "frase de abertura impactante (primeiros 3 segundos do vídeo)",
      "body": "desenvolvimento do argumento (20-30 segundos, 2-3 frases)",
      "cta": "chamada para ação final clara e direta"
    }
  ]
}

Gere exatamente 5 ugc_scripts, cada um com uma abordagem diferente (ex: problema/solução, prova social, curiosidade, autoridade, urgência).`

  let analysis: ClaudeAnalysis | null = null
  try {
    const client = new Anthropic({ apiKey: anthropicKey })
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
    // Tentar parsear JSON diretamente
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]) as ClaudeAnalysis
    }
  } catch (e) {
    // Claude falhou mas temos os anúncios — retornar sem análise
    return NextResponse.json({
      ads: ads.map(a => ({ id: a.id, page_name: a.page_name, ad_snapshot_url: a.ad_snapshot_url })),
      analysis: null,
      message: 'Anúncios encontrados, mas a análise Claude falhou. Verifique o ANTHROPIC_API_KEY.',
    })
  }

  return NextResponse.json({
    ads: ads.map(a => ({ id: a.id, page_name: a.page_name, ad_snapshot_url: a.ad_snapshot_url })),
    analysis,
    message: null,
  })
}
