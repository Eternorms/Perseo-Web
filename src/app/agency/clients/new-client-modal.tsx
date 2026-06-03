'use client'

import { useState, useTransition } from 'react'
import { createClientAction } from './actions'

const plans = [
  { value: 'starter', label: 'Starter' },
  { value: 'growth', label: 'Growth' },
  { value: 'scale', label: 'Scale' },
]

export default function NewClientModal() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = {
      business_name: fd.get('business_name') as string,
      name: fd.get('name') as string,
      niche: fd.get('niche') as string,
      contact_email: fd.get('contact_email') as string,
      contact_phone: fd.get('contact_phone') as string,
      plan: fd.get('plan') as string,
    }
    startTransition(async () => {
      const result = await createClientAction(data)
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
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors"
      >
        Novo cliente
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setOpen(false)}>
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-white">Novo cliente</h2>

            {error && (
              <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Nome da clínica" name="business_name" required placeholder="Clínica Exemplo" />
              <Field label="Responsável" name="name" required placeholder="Nome do dono" />
              <Field label="Nicho" name="niche" placeholder="Ex: Estética, Odontologia" />
              <Field label="Email de contato" name="contact_email" type="email" placeholder="contato@clinica.com" />
              <Field label="WhatsApp do responsável" name="contact_phone" placeholder="(11) 99999-9999" />

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 uppercase tracking-wide">Plano</label>
                <select
                  name="plan"
                  defaultValue="starter"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-500"
                >
                  {plans.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2 rounded-lg text-sm text-neutral-400 border border-neutral-700 hover:border-neutral-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Salvando...' : 'Criar cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Field({
  label, name, required, placeholder, type = 'text',
}: {
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
