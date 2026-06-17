'use client'

import { useState, useTransition } from 'react'
import { type AppUserRow } from '@/types'
import { createDealAction } from './actions'

interface Props {
  members: Pick<AppUserRow, 'id' | 'name'>[]
}

export default function AddDealModal({ members }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createDealAction({
        business_name: fd.get('business_name') as string,
        contact_name: fd.get('contact_name') as string,
        contact_email: fd.get('contact_email') as string,
        contact_phone: fd.get('contact_phone') as string,
        niche: fd.get('niche') as string,
        source: fd.get('source') as string,
        estimated_value: fd.get('estimated_value') as string,
        notes: fd.get('notes') as string,
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
        + Novo negócio
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white">Novo negócio</h2>
              <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-white text-lg leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">{error}</p>
              )}

              <Field label="Empresa / clínica" name="business_name" required placeholder="Ex: Clínica Derma Vita" />

              <div className="grid grid-cols-2 gap-3">
                <Field label="Contato" name="contact_name" placeholder="Nome" />
                <Field label="Telefone" name="contact_phone" placeholder="(00) 00000-0000" />
              </div>

              <Field label="E-mail" name="contact_email" type="email" placeholder="contato@..." />

              <div className="grid grid-cols-2 gap-3">
                <Field label="Nicho" name="niche" placeholder="Ex: estética" />
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 uppercase tracking-wide">Origem</label>
                  <select name="source" className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-500">
                    <option value="outbound">Outbound</option>
                    <option value="inbound">Inbound</option>
                    <option value="referral">Indicação</option>
                    <option value="event">Evento</option>
                  </select>
                </div>
              </div>

              <Field label="Valor estimado (R$/mês)" name="estimated_value" type="number" placeholder="Ex: 3000" />

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 uppercase tracking-wide">Notas</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={isPending} className="flex-1 px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50">
                  {isPending ? 'Criando...' : 'Criar negócio'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border border-neutral-700 text-neutral-400 rounded-lg text-sm hover:text-white hover:border-neutral-500 transition-colors">
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

function Field({ label, name, required, placeholder, type = 'text' }: {
  label: string; name: string; required?: boolean; placeholder?: string; type?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-neutral-400 uppercase tracking-wide">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
      />
    </div>
  )
}
