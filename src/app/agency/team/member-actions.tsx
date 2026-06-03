'use client'

import { useTransition } from 'react'
import { updateMemberTypeAction, removeMemberAction } from './actions'

interface Props {
  memberId: string
  currentType: 'agency_owner' | 'agency_staff'
  isSelf: boolean
}

export default function MemberActions({ memberId, currentType, isSelf }: Props) {
  const [isPending, startTransition] = useTransition()

  function toggleType() {
    const next = currentType === 'agency_owner' ? 'agency_staff' : 'agency_owner'
    startTransition(async () => {
      const r = await updateMemberTypeAction(memberId, next)
      if (r.error) alert(r.error)
    })
  }

  function remove() {
    if (!confirm('Remover este membro? Esta ação não pode ser desfeita.')) return
    startTransition(async () => {
      const r = await removeMemberAction(memberId)
      if (r.error) alert(r.error)
    })
  }

  if (isSelf) return <span className="text-xs text-neutral-600">Você</span>

  return (
    <div className="flex items-center gap-3 justify-end">
      <button
        onClick={toggleType}
        disabled={isPending}
        className="text-xs text-neutral-500 hover:text-white transition-colors disabled:opacity-40"
      >
        {currentType === 'agency_owner' ? 'Tornar staff' : 'Tornar owner'}
      </button>
      <button
        onClick={remove}
        disabled={isPending}
        className="text-xs text-red-600 hover:text-red-400 transition-colors disabled:opacity-40"
      >
        Remover
      </button>
    </div>
  )
}
