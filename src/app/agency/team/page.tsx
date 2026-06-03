import { createClient } from '@/lib/supabase/server'
import { type AppUser } from '@/types'
import InviteModal from './invite-modal'
import MemberActions from './member-actions'

const typeLabel: Record<string, string> = {
  agency_owner: 'Owner',
  agency_staff: 'Staff',
}

const typeColor: Record<string, string> = {
  agency_owner: 'bg-purple-500/15 text-purple-400',
  agency_staff: 'bg-blue-500/15 text-blue-400',
}

export default async function TeamPage() {
  const supabase = await createClient()

  const [{ data: me }, { data: members }] = await Promise.all([
    supabase.from('app_users').select('id, user_type').single(),
    supabase
      .from('app_users')
      .select('*')
      .in('user_type', ['agency_owner', 'agency_staff'])
      .order('created_at', { ascending: true }),
  ])

  const isOwner = me?.user_type === 'agency_owner'

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Time</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{members?.length ?? 0} membros</p>
        </div>
        {isOwner && <InviteModal />}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {!members || members.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-neutral-500 text-sm">Nenhum membro ainda.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Membro</th>
                <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Desde</th>
                {isOwner && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {(members as AppUser[]).map((m, i) => (
                <tr
                  key={m.id}
                  className={i < members.length - 1 ? 'border-b border-neutral-800/50' : ''}
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{m.name}</p>
                    <p className="text-xs text-neutral-500">{m.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor[m.user_type] ?? ''}`}>
                      {typeLabel[m.user_type] ?? m.user_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">
                    {new Date(m.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3 text-right">
                      <MemberActions
                        memberId={m.id}
                        currentType={m.user_type as 'agency_owner' | 'agency_staff'}
                        isSelf={m.id === me?.id}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isOwner && (
        <p className="text-xs text-neutral-600">Somente owners podem convidar ou remover membros.</p>
      )}
    </div>
  )
}
