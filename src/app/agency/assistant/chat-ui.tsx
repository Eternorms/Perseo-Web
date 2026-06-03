'use client'

import { useState, useRef, useEffect } from 'react'
import { type AssistantMessage } from '@/types'

interface Props {
  initialMessages: AssistantMessage[]
}

export default function ChatUI({ initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setError(null)
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: text, metadata: null, created_at: new Date().toISOString() }])
    setLoading(true)

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data.message, metadata: null, created_at: new Date().toISOString() }])
      }
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    'Quantos leads temos hoje?',
    'Liste os clientes ativos',
    'Quais agendamentos temos essa semana?',
    'Crie uma tarefa: revisar prompt do agente',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center mx-auto">
              <span className="text-white text-sm font-semibold">H</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Hermes — Assistente Perseo</p>
              <p className="text-neutral-500 text-xs mt-1">Com acesso a clientes, leads e agendamentos em tempo real</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-full text-xs text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-white text-neutral-900 rounded-br-sm'
                : 'bg-neutral-800 text-neutral-100 rounded-bl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 text-center">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3 pt-4 border-t border-neutral-800">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          placeholder="Pergunte sobre clientes, leads, agendamentos..."
          className="flex-1 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-3 bg-white text-neutral-900 rounded-xl text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
