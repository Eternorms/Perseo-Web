'use client'

import { useState, useTransition } from 'react'
import { inviteClientAccessAction } from './actions'

interface Props {
  clientId: string
}

export default function InviteClientModal({ clientId }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await inviteClientAccessAction(clientId, {
        name: fd.get('name') as string,
        email: fd.get('email') as string,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setSent(true)
        setTimeout(() => { setOpen(false); setSent(false) }, 2000)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(null); setSent(false) }}
        className="px-3 py-1.5 border border-neutral-700 text-neutral-400 rounded-lg text-xs hover:text-white hover:border-neutral-500 transition-colors"
      >
        Convidar acesso
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white">Convidar cliente</h2>
              <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-white text-lg leading-none">×</button>
            </div>

            {sent ? (
              <p className="text-sm text-emerald-400 text-center py-4">Convite enviado com sucesso!</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">{error}</p>
                )}
                <p className="text-xs text-neutral-500">
                  O cliente receberá um email com link para criar senha e completar a configuração da conta.
                </p>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 uppercase tracking-wide">Nome</label>
                  <input
                    name="name"
                    required
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 uppercase tracking-wide">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'Enviando...' : 'Enviar convite'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 border border-neutral-700 text-neutral-400 rounded-lg text-sm hover:text-white hover:border-neutral-500 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
