'use client'

import { useState, useTransition } from 'react'
import { type Client } from '@/types'
import { updateClientAction } from './actions'

interface Props {
  client: Client
}

export default function EditClientForm({ client }: Props) {
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const perseoRaw = fd.get('perseo_client_id') as string
      const result = await updateClientAction(client.id, {
        business_name: fd.get('business_name') as string,
        name: fd.get('name') as string,
        niche: fd.get('niche') as string,
        contact_email: fd.get('contact_email') as string,
        contact_phone: fd.get('contact_phone') as string,
        whatsapp_instance: fd.get('whatsapp_instance') as string,
        whatsapp_phone: fd.get('whatsapp_phone') as string,
        meta_page_id: fd.get('meta_page_id') as string,
        meta_form_id: fd.get('meta_form_id') as string,
        ig_page_id: fd.get('ig_page_id') as string,
        meta_token: fd.get('meta_token') as string,
        agent_prompt: fd.get('agent_prompt') as string,
        agent_active: fd.get('agent_active') === 'on',
        perseo_client_id: perseoRaw ? Number(perseoRaw) : null,
      })
      if (result.error) {
        setError(result.error)
        setSaved(false)
      } else {
        setError(null)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">{error}</p>
      )}

      <Section title="Dados da clínica">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome da clínica" name="business_name" defaultValue={client.business_name} required />
          <Field label="Responsável" name="name" defaultValue={client.name} required />
          <Field label="Nicho" name="niche" defaultValue={client.niche ?? ''} />
          <Field label="Email de contato" name="contact_email" type="email" defaultValue={client.contact_email ?? ''} />
          <Field label="Telefone de contato" name="contact_phone" defaultValue={client.contact_phone ?? ''} />
        </div>
      </Section>

      <Section title="WhatsApp">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Instância Evolution" name="whatsapp_instance" defaultValue={client.whatsapp_instance ?? ''} placeholder="nome-da-instancia" />
          <Field label="Número WhatsApp" name="whatsapp_phone" defaultValue={client.whatsapp_phone ?? ''} placeholder="5511999999999" />
        </div>
      </Section>

      <Section title="Meta Ads">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Page ID (formulários de lead)" name="meta_page_id" defaultValue={client.meta_page_id ?? ''} />
          <Field label="Form ID" name="meta_form_id" defaultValue={client.meta_form_id ?? ''} />
          <Field label="Instagram Page ID (publicações)" name="ig_page_id" defaultValue={client.ig_page_id ?? ''} placeholder="ID da página do Instagram" />
          <Field label="Meta Access Token (publicações)" name="meta_token" defaultValue={client.meta_token ?? ''} placeholder="Token de acesso à API" />
        </div>
      </Section>

      <Section title="App Produto (produção de criativos)">
        <Field
          label="ID do cliente no App Produto (perseo.clients.id)"
          name="perseo_client_id"
          defaultValue={client.perseo_client_id != null ? String(client.perseo_client_id) : ''}
          placeholder="Ex: 1 — ID gerado pelo App Produto ao cadastrar o cliente"
        />
        <p className="text-xs text-neutral-600 mt-1">
          Necessário para o portal de criativos do cliente funcionar. Encontre o ID no App Produto (lista de clientes).
        </p>
      </Section>

      <Section title="Agente de IA">
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="agent_active"
              defaultChecked={client.agent_active}
              className="w-4 h-4 rounded accent-white"
            />
            <span className="text-sm text-neutral-300">Agente ativo</span>
          </label>
          <div className="space-y-1">
            <label className="text-xs text-neutral-400 uppercase tracking-wide">Prompt do agente</label>
            <textarea
              name="agent_prompt"
              defaultValue={client.agent_prompt ?? ''}
              rows={5}
              placeholder="Você é o assistente da Clínica X. Seu objetivo é..."
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-500 resize-none"
            />
          </div>
        </div>
      </Section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Salvando...' : 'Salvar alterações'}
        </button>
        {saved && <span className="text-xs text-emerald-400">Salvo!</span>}
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{title}</h3>
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        {children}
      </div>
    </div>
  )
}

function Field({
  label, name, defaultValue, required, placeholder, type = 'text',
}: {
  label: string; name: string; defaultValue?: string; required?: boolean; placeholder?: string; type?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-neutral-400 uppercase tracking-wide">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
      />
    </div>
  )
}
