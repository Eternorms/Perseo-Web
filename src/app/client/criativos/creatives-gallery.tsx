'use client'

import { useState, useTransition } from 'react'
import { decideCreativeAction } from './actions'

type Approval = {
  id: number
  title: string | null
  description: string | null
  media_url: string | null
  thumbnail_url: string | null
  status: string
  client_feedback: string | null
  submitted_at: string
  decided_at: string | null
  scheduled_at: string | null
}

const STATUS_LABEL: Record<string, string> = {
  pending:  'Aguardando aprovação',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  revision: 'Revisão solicitada',
}

const STATUS_COLOR: Record<string, string> = {
  pending:  'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
  revision: 'bg-blue-500/15 text-blue-400',
}

function isVideoUrl(url: string) {
  const path = url.split('?')[0].toLowerCase()
  return path.endsWith('.mp4') || path.endsWith('.mov') || path.endsWith('.webm')
}

function CreativeCard({ approval }: { approval: Approval }) {
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState<'revision' | 'rejected' | null>(null)
  const [isPending, startTransition] = useTransition()
  const [localStatus, setLocalStatus] = useState(approval.status)
  const [error, setError] = useState<string | null>(null)

  function decide(status: 'approved' | 'rejected' | 'revision', fb?: string) {
    setError(null)
    startTransition(async () => {
      const res = await decideCreativeAction(approval.id, status, fb)
      if (res.error) {
        setError(res.error)
      } else {
        setLocalStatus(status)
        setShowFeedback(null)
        setFeedback('')
      }
    })
  }

  const scheduledDate = approval.scheduled_at
    ? new Date(approval.scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
      {/* Mídia */}
      <div className="aspect-video bg-neutral-950 flex items-center justify-center relative">
        {approval.media_url ? (
          isVideoUrl(approval.media_url) ? (
            <video
              src={approval.media_url}
              poster={approval.thumbnail_url ?? undefined}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <a
              href={approval.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 text-neutral-400 hover:text-white transition-colors"
            >
              {approval.thumbnail_url && (
                <img
                  src={approval.thumbnail_url}
                  alt={approval.title ?? 'Criativo'}
                  className="w-full h-full object-cover absolute inset-0"
                />
              )}
              <span className="relative z-10 bg-black/60 px-3 py-1.5 rounded-lg text-xs">
                Abrir mídia ↗
              </span>
            </a>
          )
        ) : (
          <span className="text-xs text-neutral-600">Sem mídia</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {approval.title ?? 'Criativo sem título'}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Enviado em {new Date(approval.submitted_at).toLocaleDateString('pt-BR')}
              {scheduledDate && ` · Publicação prevista: ${scheduledDate}`}
            </p>
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[localStatus] ?? 'bg-neutral-700 text-neutral-300'}`}>
            {STATUS_LABEL[localStatus] ?? localStatus}
          </span>
        </div>

        {approval.description && (
          <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
            {approval.description}
          </p>
        )}

        {/* Feedback já dado */}
        {localStatus !== 'pending' && approval.client_feedback && (
          <div className="bg-neutral-800/60 rounded-lg p-3">
            <p className="text-xs text-neutral-500 mb-1">Seu feedback:</p>
            <p className="text-xs text-neutral-300">{approval.client_feedback}</p>
          </div>
        )}

        {/* Ações — apenas se pendente */}
        {localStatus === 'pending' && (
          <div className="flex flex-col gap-2 mt-auto pt-2">
            {showFeedback ? (
              <>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder={showFeedback === 'revision' ? 'Descreva o que deve ser ajustado...' : 'Motivo da rejeição...'}
                  rows={3}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-600 resize-none focus:outline-none focus:border-neutral-500"
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => decide(showFeedback, feedback)}
                    disabled={isPending || !feedback.trim()}
                    className="flex-1 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-xs rounded-lg transition-colors disabled:opacity-40"
                  >
                    {isPending ? 'Enviando...' : 'Confirmar'}
                  </button>
                  <button
                    onClick={() => { setShowFeedback(null); setFeedback(''); setError(null) }}
                    disabled={isPending}
                    className="px-3 py-1.5 text-neutral-500 hover:text-white text-xs transition-colors disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => decide('approved')}
                  disabled={isPending}
                  className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
                >
                  {isPending ? '...' : 'Aprovar'}
                </button>
                <button
                  onClick={() => setShowFeedback('revision')}
                  disabled={isPending}
                  className="flex-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-medium rounded-lg transition-colors border border-blue-600/30 disabled:opacity-40"
                >
                  Pedir ajuste
                </button>
                <button
                  onClick={() => setShowFeedback('rejected')}
                  disabled={isPending}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-xs rounded-lg transition-colors disabled:opacity-40"
                >
                  Rejeitar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CreativesGallery({ approvals }: { approvals: Approval[] }) {
  if (approvals.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
        <p className="text-sm text-neutral-500">Nenhum criativo disponível ainda.</p>
        <p className="text-xs text-neutral-600 mt-1">Os vídeos produzidos pela agência aparecerão aqui para aprovação.</p>
      </div>
    )
  }

  const pending = approvals.filter(a => a.status === 'pending')
  const others  = approvals.filter(a => a.status !== 'pending')

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Aguardando sua aprovação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pending.map(a => <CreativeCard key={a.id} approval={a} />)}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Histórico</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {others.map(a => <CreativeCard key={a.id} approval={a} />)}
          </div>
        </section>
      )}
    </div>
  )
}
