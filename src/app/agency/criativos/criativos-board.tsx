'use client'

import { useState, useTransition } from 'react'
import { scheduleCreativeAction, resubmitCreativeAction } from './actions'

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
  meta_post_id: string | null
  client_brand: string | null
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Aguard. cliente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  revision: 'Revisão',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
  revision: 'bg-blue-500/15 text-blue-400',
}

function isVideo(url: string) {
  const p = url.split('?')[0].toLowerCase()
  return p.endsWith('.mp4') || p.endsWith('.mov') || p.endsWith('.webm')
}

function ScheduleModal({ approval, onClose }: { approval: Approval; onClose: () => void }) {
  const [date, setDate] = useState(
    approval.scheduled_at
      ? new Date(approval.scheduled_at).toISOString().slice(0, 16)
      : ''
  )
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit() {
    if (!date) { setError('Informe a data e hora.'); return }
    startTransition(async () => {
      const r = await scheduleCreativeAction(approval.id, new Date(date).toISOString())
      if (r.error) { setError(r.error); return }
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Agendar publicação</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white text-xl leading-none">×</button>
        </div>
        <p className="text-xs text-neutral-500 truncate">{approval.title ?? 'Criativo'}</p>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="space-y-1">
          <label className="text-xs text-neutral-400 uppercase tracking-wide">Data e hora de publicação</label>
          <input
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-500"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={submit}
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Salvando...' : 'Confirmar'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-neutral-700 text-neutral-400 rounded-lg text-sm hover:text-white transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function ApprovalCard({ approval }: { approval: Approval }) {
  const [scheduling, setScheduling] = useState(false)
  const [isPending, startTransition] = useTransition()

  function resubmit() {
    startTransition(async () => { await resubmitCreativeAction(approval.id) })
  }

  const isRevision = approval.status === 'revision'
  const isApproved = approval.status === 'approved'

  return (
    <>
      {scheduling && <ScheduleModal approval={approval} onClose={() => setScheduling(false)} />}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
        {/* Mídia */}
        <div className="aspect-video bg-neutral-950 relative flex items-center justify-center">
          {approval.media_url ? (
            isVideo(approval.media_url) ? (
              <video src={approval.media_url} poster={approval.thumbnail_url ?? undefined} controls className="w-full h-full object-contain" />
            ) : (
              <a href={approval.media_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center">
                {approval.thumbnail_url && <img src={approval.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                <span className="relative z-10 text-xs bg-black/60 text-white px-3 py-1.5 rounded-lg">Abrir ↗</span>
              </a>
            )
          ) : (
            <span className="text-xs text-neutral-600">Sem mídia</span>
          )}

          {/* Brand badge */}
          {approval.client_brand && (
            <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
              {approval.client_brand}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-white truncate flex-1">{approval.title ?? 'Criativo sem título'}</p>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[approval.status] ?? 'bg-neutral-700 text-neutral-300'}`}>
              {STATUS_LABEL[approval.status] ?? approval.status}
            </span>
          </div>

          <p className="text-xs text-neutral-500">
            Enviado {new Date(approval.submitted_at).toLocaleDateString('pt-BR')}
            {approval.decided_at && ` · Decidido ${new Date(approval.decided_at).toLocaleDateString('pt-BR')}`}
          </p>

          {/* Feedback do cliente */}
          {isRevision && approval.client_feedback && (
            <div className="bg-blue-950/40 border border-blue-800/30 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-blue-300">Feedback do cliente:</p>
              <p className="text-xs text-blue-100 leading-relaxed">{approval.client_feedback}</p>
            </div>
          )}

          {/* Data agendada */}
          {isApproved && (
            <div className="flex items-center justify-between">
              <div>
                {approval.scheduled_at ? (
                  <p className="text-xs text-emerald-400">
                    Publicação: {new Date(approval.scheduled_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    {approval.meta_post_id && ' · Agendado ✓'}
                  </p>
                ) : (
                  <p className="text-xs text-amber-400">Sem data definida</p>
                )}
              </div>
              <button
                onClick={() => setScheduling(true)}
                className="text-xs px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              >
                {approval.scheduled_at ? 'Alterar data' : 'Agendar'}
              </button>
            </div>
          )}

          {/* Ações para revisão */}
          {isRevision && (
            <div className="flex gap-2 mt-auto pt-1">
              <button
                onClick={resubmit}
                disabled={isPending}
                className="flex-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-medium rounded-lg transition-colors border border-blue-600/30 disabled:opacity-40"
              >
                {isPending ? '...' : 'Reenviar para aprovação'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const TAB_LABELS = ['Pendentes', 'Revisão', 'Aprovados', 'Todos']

export default function CriativosBoard({ approvals }: { approvals: Approval[] }) {
  const [tab, setTab] = useState(0)

  const pending  = approvals.filter(a => a.status === 'pending')
  const revision = approvals.filter(a => a.status === 'revision')
  const approved = approvals.filter(a => a.status === 'approved')

  const counts = [pending.length, revision.length, approved.length, approvals.length]
  const views  = [pending, revision, approved, approvals]
  const current = views[tab]

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-800">
        {TAB_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              tab === i ? 'border-white text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {label}
            {counts[i] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                i === 1 ? 'bg-blue-500/20 text-blue-400' :
                i === 0 ? 'bg-amber-500/20 text-amber-400' :
                'bg-neutral-700 text-neutral-400'
              }`}>
                {counts[i]}
              </span>
            )}
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
          <p className="text-sm text-neutral-600">Nenhum criativo nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {current.map(a => <ApprovalCard key={a.id} approval={a} />)}
        </div>
      )}
    </div>
  )
}
