'use client'

import { useState, useTransition } from 'react'
import { inviteTeamMemberAction } from './actions'

export default function InviteModal() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await inviteTeamMemberAction({
        name: fd.get('name') as string,
        email: fd.get('email') as string,
        user_type: fd.get('user_type') as 'agency_owner' | 'agency_staff',
      })
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setError(null)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(null) }}
        className="px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors"
      >
        Convidar membro
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white">Convidar membro</h2>
              <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-white transition-colors text-lg leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 uppercase tracking-wide">Nome</label>
                <input
                  name="name"
                  required
                  placeholder="João Silva"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 uppercase tracking-wide">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="joao@clinica.com"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 uppercase tracking-wide">Tipo</label>
                <select
                  name="user_type"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-500"
                >
                  <option value="agency_staff">Staff (acesso limitado)</option>
                  <option value="agency_owner">Owner (acesso total)</option>
                </select>
              </div>

              <p className="text-xs text-neutral-500">
                Um email de convite será enviado. O membro precisará criar uma senha para acessar o painel.
              </p>

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
          </div>
        </div>
      )}
    </>
  )
}
