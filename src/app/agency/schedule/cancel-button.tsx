'use client'

import { useTransition } from 'react'
import { cancelScheduledPostAction } from './actions'

export default function CancelButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => { await cancelScheduledPostAction(postId) })}
      className="text-xs text-neutral-600 hover:text-red-400 transition-colors disabled:opacity-40"
    >
      {isPending ? '...' : 'Cancelar'}
    </button>
  )
}
