'use client'

import { usePathname } from 'next/navigation'

interface Props {
  name: string
  isOwner: boolean
  pendingCreatives?: number
  logout: () => Promise<void>
}

const baseItems = [
  { href: '/client/dashboard', label: 'Dashboard' },
  { href: '/client/criativos', label: 'Criativos' },
  { href: '/client/appointments', label: 'Agendamentos' },
  { href: '/client/messages', label: 'Mensagens' },
]

const ownerItems = [
  { href: '/client/reports', label: 'Relatórios' },
  { href: '/client/settings', label: 'Configurações' },
]

export default function ClientSidebar({ name, isOwner, pendingCreatives = 0, logout }: Props) {
  const pathname = usePathname()
  const items = isOwner ? [...baseItems, ...ownerItems] : baseItems

  return (
    <aside className="w-56 border-r border-neutral-800 flex flex-col py-6 px-4 gap-1">
      <div className="px-2 mb-6">
        <span className="text-sm font-semibold tracking-wide text-white">Perseo</span>
        <p className="text-xs text-neutral-500 mt-0.5 truncate">{name}</p>
      </div>
      <nav className="flex-1 flex flex-col gap-0.5">
        {items.map(item => {
          const active = pathname === item.href || (item.href !== '/client/dashboard' && pathname.startsWith(item.href))
          const badge = item.href === '/client/criativos' && pendingCreatives > 0 ? pendingCreatives : 0
          return (
            <a
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                active
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              {item.label}
              {badge > 0 && (
                <span className="text-xs bg-amber-500 text-black font-semibold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {badge}
                </span>
              )}
            </a>
          )
        })}
      </nav>
      <form action={logout} className="px-2">
        <button
          type="submit"
          className="w-full text-left px-3 py-2 rounded-lg text-xs text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/40 transition-colors"
        >
          Sair
        </button>
      </form>
    </aside>
  )
}
