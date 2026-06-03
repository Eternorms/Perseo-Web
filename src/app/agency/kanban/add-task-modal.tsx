'use client'

import { useState, useTransition } from 'react'
import { type Client, type AppUser } from '@/types'
import { createTaskAction } from './actions'

interface Props {
  clients: Pick<Client, 'id' | 'business_name'>[]
  members: Pick<AppUser, 'id' | 'name'>[]
}

export default function AddTaskModal({ clients, members }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createTaskAction({
        title: fd.get('title') as string,
        description: fd.get('description') as string,
        priority: fd.get('priority') as string,
        client_id: fd.get('client_id') as string,
        assigned_to: fd.get('assigned_to') as string,
        due_date: fd.get('due_date') as string,
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
        + Nova tarefa
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white">Nova tarefa</h2>
              <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-white text-lg leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">{error}</p>
              )}

              <Field label="Título" name="title" required placeholder="Ex: Configurar instância WhatsApp" />
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 uppercase tracking-wide">Descrição</label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 uppercase tracking-wide">Prioridade</label>
                  <select name="priority" className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-500">
                    <option value="low">Baixa</option>
                    <option value="medium" selected>Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <Field label="Prazo" name="due_date" type="date" />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 uppercase tracking-wide">Cliente</label>
                <select name="client_id" className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-500">
                  <option value="">— Sem cliente —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 uppercase tracking-wide">Responsável</label>
                <select name="assigned_to" className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-500">
                  <option value="">— Sem responsável —</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={isPending} className="flex-1 px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50">
                  {isPending ? 'Criando...' : 'Criar tarefa'}
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
