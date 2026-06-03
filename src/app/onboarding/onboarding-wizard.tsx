'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { type Client } from '@/types'
import {
  saveStep1Action,
  saveStep2Action,
  saveStep3Action,
  saveStep4Action,
  saveStep5Action,
  completeOnboardingAction,
} from './actions'

const TOTAL_STEPS = 6

const stepTitles = [
  'Dados da clínica',
  'WhatsApp',
  'Meta Ads',
  'Google Calendar',
  'Agente de IA',
  'Revisão',
]

interface Props {
  client: Client
}

export default function OnboardingWizard({ client }: Props) {
  const [step, setStep] = useState(Math.min(client.onboarding_step, TOTAL_STEPS))
  const [data, setData] = useState(client)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function next(updated?: Partial<Client>) {
    if (updated) setData(prev => ({ ...prev, ...updated }))
    setError(null)
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  function back() {
    setError(null)
    setStep(s => Math.max(s - 1, 1))
  }

  async function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      business_name: fd.get('business_name') as string,
      name: fd.get('name') as string,
      niche: fd.get('niche') as string,
      contact_name: fd.get('contact_name') as string,
      contact_email: fd.get('contact_email') as string,
      contact_phone: fd.get('contact_phone') as string,
    }
    startTransition(async () => {
      const r = await saveStep1Action(payload)
      if (r.error) { setError(r.error); return }
      next(payload)
    })
  }

  async function handleStep2(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      whatsapp_type: fd.get('whatsapp_type') as string,
      whatsapp_instance: fd.get('whatsapp_instance') as string,
      whatsapp_phone: fd.get('whatsapp_phone') as string,
    }
    startTransition(async () => {
      const r = await saveStep2Action(payload)
      if (r.error) { setError(r.error); return }
      next({ whatsapp_instance: payload.whatsapp_instance, whatsapp_phone: payload.whatsapp_phone })
    })
  }

  async function handleStep3(e: React.FormEvent<HTMLFormElement>, skip?: boolean) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = skip
      ? { meta_page_id: '', meta_form_id: '' }
      : { meta_page_id: fd.get('meta_page_id') as string, meta_form_id: fd.get('meta_form_id') as string }
    startTransition(async () => {
      const r = await saveStep3Action(payload)
      if (r.error) { setError(r.error); return }
      next(payload)
    })
  }

  async function handleStep4(e: React.FormEvent<HTMLFormElement>, skip?: boolean) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = skip ? { calendar_id: '' } : { calendar_id: fd.get('calendar_id') as string }
    startTransition(async () => {
      const r = await saveStep4Action(payload)
      if (r.error) { setError(r.error); return }
      next(payload)
    })
  }

  async function handleStep5(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      agent_prompt: fd.get('agent_prompt') as string,
      agent_active: fd.get('agent_active') === 'on',
    }
    startTransition(async () => {
      const r = await saveStep5Action(payload)
      if (r.error) { setError(r.error); return }
      next(payload)
    })
  }

  async function handleComplete() {
    startTransition(async () => {
      const r = await completeOnboardingAction()
      if (r.error) { setError(r.error); return }
      router.push('/client/dashboard')
    })
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>{stepTitles[step - 1]}</span>
          <span>Passo {step} de {TOTAL_STEPS}</span>
        </div>
        <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        {error && (
          <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <h2 className="text-sm font-semibold text-white mb-4">Dados da clínica</h2>
            <Field label="Nome da clínica" name="business_name" defaultValue={data.business_name} required />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Responsável (nome)" name="name" defaultValue={data.name} required />
              <Field label="Nicho (ex: estética, ortopedia)" name="niche" defaultValue={data.niche ?? ''} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome para contato" name="contact_name" defaultValue={data.contact_name ?? ''} />
              <Field label="Telefone" name="contact_phone" defaultValue={data.contact_phone ?? ''} />
            </div>
            <Field label="Email" name="contact_email" type="email" defaultValue={data.contact_email ?? ''} />
            <Actions isPending={isPending} showBack={false} />
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-4">
            <h2 className="text-sm font-semibold text-white mb-4">Configuração do WhatsApp</h2>
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 uppercase tracking-wide">Tipo de integração</label>
              <div className="flex gap-3">
                {(['evolution', 'meta'] as const).map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="whatsapp_type"
                      value={t}
                      defaultChecked={data.whatsapp_type === t || (!data.whatsapp_type && t === 'evolution')}
                      className="accent-white"
                    />
                    <span className="text-sm text-neutral-300">{t === 'evolution' ? 'Evolution API' : 'Meta Cloud API'}</span>
                  </label>
                ))}
              </div>
            </div>
            <Field label="Nome da instância" name="whatsapp_instance" defaultValue={data.whatsapp_instance ?? ''} placeholder="nome-da-instancia" />
            <Field label="Número WhatsApp (com DDI)" name="whatsapp_phone" defaultValue={data.whatsapp_phone ?? ''} placeholder="5511999999999" />
            <Actions isPending={isPending} onBack={back} />
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleStep3} className="space-y-4">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Meta Ads</h2>
              <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">Opcional</span>
            </div>
            <p className="text-xs text-neutral-500">Necessário para captura automática de leads via formulários do Facebook/Instagram.</p>
            <Field label="Page ID" name="meta_page_id" defaultValue={data.meta_page_id ?? ''} placeholder="123456789" />
            <Field label="Lead Form ID" name="meta_form_id" defaultValue={data.meta_form_id ?? ''} placeholder="987654321" />
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Salvando...' : 'Continuar'}
              </button>
              <button
                type="button"
                onClick={(e) => handleStep3(e as unknown as React.FormEvent<HTMLFormElement>, true)}
                disabled={isPending}
                className="px-4 py-2 border border-neutral-700 text-neutral-400 rounded-lg text-sm hover:text-white hover:border-neutral-500 transition-colors disabled:opacity-40"
              >
                Pular
              </button>
              <button type="button" onClick={back} disabled={isPending} className="px-3 py-2 text-neutral-500 hover:text-white text-sm transition-colors disabled:opacity-40">← Voltar</button>
            </div>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={handleStep4} className="space-y-4">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Google Calendar</h2>
              <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">Opcional</span>
            </div>
            <p className="text-xs text-neutral-500">O agente usará este calendário para verificar disponibilidade e criar agendamentos automaticamente.</p>
            <Field
              label="ID do calendário"
              name="calendar_id"
              defaultValue={data.calendar_id ?? ''}
              placeholder="clinica@gmail.com ou ID do Google Calendar"
            />
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Salvando...' : 'Continuar'}
              </button>
              <button
                type="button"
                onClick={(e) => handleStep4(e as unknown as React.FormEvent<HTMLFormElement>, true)}
                disabled={isPending}
                className="px-4 py-2 border border-neutral-700 text-neutral-400 rounded-lg text-sm hover:text-white hover:border-neutral-500 transition-colors disabled:opacity-40"
              >
                Pular
              </button>
              <button type="button" onClick={back} disabled={isPending} className="px-3 py-2 text-neutral-500 hover:text-white text-sm transition-colors disabled:opacity-40">← Voltar</button>
            </div>
          </form>
        )}

        {step === 5 && (
          <form onSubmit={handleStep5} className="space-y-4">
            <h2 className="text-sm font-semibold text-white mb-4">Agente de IA</h2>
            <p className="text-xs text-neutral-500">O agente responde leads no WhatsApp e agenda consultas automaticamente. Personalize como ele se apresenta.</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agent_active"
                defaultChecked={data.agent_active}
                className="w-4 h-4 rounded accent-white"
              />
              <span className="text-sm text-neutral-300">Ativar agente imediatamente após o onboarding</span>
            </label>
            <div className="space-y-1">
              <label className="text-xs text-neutral-400 uppercase tracking-wide">Prompt do agente</label>
              <textarea
                name="agent_prompt"
                defaultValue={data.agent_prompt ?? ''}
                rows={6}
                placeholder={`Você é a assistente virtual da ${data.business_name || 'Clínica'}. Seu objetivo é atender leads do Instagram/Facebook, responder dúvidas sobre os tratamentos e agendar consultas. Seja cordial, profissional e conciso.`}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-500 resize-none"
              />
            </div>
            <Actions isPending={isPending} onBack={back} />
          </form>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-white">Revisão</h2>
            <ReviewSection title="Clínica">
              <ReviewRow label="Nome" value={data.business_name} />
              <ReviewRow label="Responsável" value={data.name} />
              {data.niche && <ReviewRow label="Nicho" value={data.niche} />}
              {data.contact_phone && <ReviewRow label="Telefone" value={data.contact_phone} />}
              {data.contact_email && <ReviewRow label="Email" value={data.contact_email} />}
            </ReviewSection>
            <ReviewSection title="WhatsApp">
              <ReviewRow label="Tipo" value={data.whatsapp_type ?? '—'} />
              <ReviewRow label="Instância" value={data.whatsapp_instance ?? '—'} />
              <ReviewRow label="Número" value={data.whatsapp_phone ?? '—'} />
            </ReviewSection>
            {(data.meta_page_id || data.meta_form_id) && (
              <ReviewSection title="Meta Ads">
                {data.meta_page_id && <ReviewRow label="Page ID" value={data.meta_page_id} />}
                {data.meta_form_id && <ReviewRow label="Form ID" value={data.meta_form_id} />}
              </ReviewSection>
            )}
            {data.calendar_id && (
              <ReviewSection title="Google Calendar">
                <ReviewRow label="Calendar ID" value={data.calendar_id} />
              </ReviewSection>
            )}
            <ReviewSection title="Agente de IA">
              <ReviewRow label="Status" value={data.agent_active ? 'Ativo após onboarding' : 'Inativo'} />
              {data.agent_prompt && (
                <div className="mt-1">
                  <p className="text-xs text-neutral-500 mb-1">Prompt</p>
                  <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">{data.agent_prompt}</p>
                </div>
              )}
            </ReviewSection>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleComplete}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 bg-white text-neutral-900 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Concluindo...' : 'Concluir configuração'}
              </button>
              <button type="button" onClick={back} disabled={isPending} className="px-3 py-2 text-neutral-500 hover:text-white text-sm transition-colors disabled:opacity-40">← Voltar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Actions({ isPending, onBack, showBack = true }: { isPending: boolean; onBack?: () => void; showBack?: boolean }) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="submit"
        disabled={isPending}
        className="flex-1 px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Salvando...' : 'Continuar'}
      </button>
      {showBack && onBack && (
        <button type="button" onClick={onBack} disabled={isPending} className="px-3 py-2 text-neutral-500 hover:text-white text-sm transition-colors disabled:opacity-40">← Voltar</button>
      )}
    </div>
  )
}

function Field({ label, name, defaultValue, required, placeholder, type = 'text' }: {
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

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">{title}</p>
      <div className="bg-neutral-800/50 rounded-lg px-3 py-2 space-y-1">{children}</div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className="text-xs text-neutral-300">{value}</span>
    </div>
  )
}
