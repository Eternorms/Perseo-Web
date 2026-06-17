'use client'

import { useState, useTransition } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { type Deal, type DealStage, type AppUserRow } from '@/types'
import { updateDealStageAction, deleteDealAction } from './actions'

const COLUMNS: { id: DealStage; label: string }[] = [
  { id: 'identified', label: 'Identificado' },
  { id: 'warmed', label: 'Aquecido' },
  { id: 'conversation', label: 'Conversa' },
  { id: 'audit', label: 'Auditoria' },
  { id: 'proposal', label: 'Proposta' },
  { id: 'negotiation', label: 'Negociação' },
  { id: 'won', label: 'Ganho' },
  { id: 'lost', label: 'Perdido' },
]

function formatValue(v: number | null): string | null {
  if (v == null) return null
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

interface Props {
  initialDeals: Deal[]
  members: Pick<AppUserRow, 'id' | 'name'>[]
}

export default function PipelineBoard({ initialDeals, members }: Props) {
  const [deals, setDeals] = useState(initialDeals)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [, startTransition] = useTransition()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const memberMap = Object.fromEntries(members.map(m => [m.id, m.name]))

  function onDragStart(event: DragStartEvent) {
    const deal = deals.find(d => d.id === event.active.id)
    if (deal) setActiveDeal(deal)
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string

    const activeDeal = deals.find(d => d.id === activeId)
    if (!activeDeal) return

    const overIsColumn = COLUMNS.some(c => c.id === overId)
    const overDeal = deals.find(d => d.id === overId)
    const newStage = overIsColumn ? overId as DealStage : overDeal?.stage

    if (newStage && newStage !== activeDeal.stage) {
      setDeals(prev => prev.map(d => d.id === activeId ? { ...d, stage: newStage } : d))
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDeal(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const deal = deals.find(d => d.id === activeId)
    if (!deal) return

    const overIsColumn = COLUMNS.some(c => c.id === overId)
    const overDeal = deals.find(d => d.id === overId)
    const newStage = overIsColumn ? overId as DealStage : overDeal?.stage

    if (newStage && newStage !== initialDeals.find(d => d.id === activeId)?.stage) {
      startTransition(async () => {
        await updateDealStageAction(activeId, newStage)
      })
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Remover este negócio do pipeline?')) return
    setDeals(prev => prev.filter(d => d.id !== id))
    startTransition(async () => { await deleteDealAction(id) })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colDeals = deals.filter(d => d.stage === col.id)
          const colValue = colDeals.reduce((sum, d) => sum + (d.estimated_value ?? 0), 0)
          return (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              deals={colDeals}
              colValue={colValue}
              memberMap={memberMap}
              onDelete={handleDelete}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeDeal && (
          <DealCard
            deal={activeDeal}
            ownerName={activeDeal.owner_id ? memberMap[activeDeal.owner_id] : null}
            onDelete={() => {}}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

function Column({ id, label, deals, colValue, memberMap, onDelete }: {
  id: DealStage
  label: string
  deals: Deal[]
  colValue: number
  memberMap: Record<string, string>
  onDelete: (id: string) => void
}) {
  const { setNodeRef } = useSortable({ id, data: { type: 'column' } })

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-64">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{label}</span>
        <span className="text-xs text-neutral-600 bg-neutral-800 rounded-full px-2 py-0.5">{deals.length}</span>
      </div>
      {colValue > 0 && (
        <p className="text-xs text-neutral-600 mb-2">{formatValue(colValue)}</p>
      )}
      <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[80px]">
          {deals.map(deal => (
            <SortableDealCard
              key={deal.id}
              deal={deal}
              ownerName={deal.owner_id ? memberMap[deal.owner_id] : null}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

function SortableDealCard({ deal, ownerName, onDelete }: {
  deal: Deal
  ownerName: string | null
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} ownerName={ownerName} onDelete={onDelete} />
    </div>
  )
}

function DealCard({ deal, ownerName, onDelete, isDragging }: {
  deal: Deal
  ownerName: string | null
  onDelete: (id: string) => void
  isDragging?: boolean
}) {
  const value = formatValue(deal.estimated_value)
  return (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-2 cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-2xl rotate-1' : 'hover:border-neutral-700'} transition-colors`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-white leading-snug">{deal.business_name}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(deal.id) }}
          className="text-neutral-600 hover:text-red-400 transition-colors text-xs flex-shrink-0 mt-0.5"
          onPointerDown={e => e.stopPropagation()}
        >
          ×
        </button>
      </div>

      {deal.niche && (
        <p className="text-xs text-neutral-500 line-clamp-1">{deal.niche}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {value && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-xs font-medium">
            {value}
          </span>
        )}
        {deal.source && (
          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 text-xs truncate max-w-[90px]">
            {deal.source}
          </span>
        )}
      </div>

      {ownerName && (
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-xs text-neutral-500">{ownerName}</span>
        </div>
      )}
    </div>
  )
}
