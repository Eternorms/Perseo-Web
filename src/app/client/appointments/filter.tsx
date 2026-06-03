'use client'

import { useRouter, usePathname } from 'next/navigation'

const filters = [
  { value: 'all', label: 'Todos' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'completed', label: 'Realizado' },
  { value: 'cancelled', label: 'Cancelado' },
]

export default function AppointmentsFilter({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
      {filters.map(f => (
        <button
          key={f.value}
          onClick={() => router.push(f.value === 'all' ? pathname : `${pathname}?status=${f.value}`)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            current === f.value
              ? 'bg-neutral-700 text-white'
              : 'text-neutral-500 hover:text-white'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
