import { createClient } from '@/lib/supabase/server'
import { type Deal, type AppUserRow } from '@/types'
import PipelineBoard from './pipeline-board'
import AddDealModal from './add-deal-modal'

export default async function PipelinePage() {
  const supabase = await createClient()

  const [{ data: deals }, { data: members }] = await Promise.all([
    supabase.from('deals').select('*').order('created_at', { ascending: false }),
    supabase.from('app_users').select('id, name').in('user_type', ['agency_owner', 'agency_staff']),
  ])

  const d = (deals as Deal[]) ?? []
  const m = (members as Pick<AppUserRow, 'id' | 'name'>[]) ?? []

  const open = d.filter(x => x.stage !== 'won' && x.stage !== 'lost')
  const pipelineValue = open.reduce((sum, x) => sum + (x.estimated_value ?? 0), 0)
  const won = d.filter(x => x.stage === 'won').length

  return (
    <div className="p-8 space-y-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Pipeline de vendas</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {open.length} negócios abertos · {pipelineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} em pipeline · {won} ganhos
          </p>
        </div>
        <AddDealModal members={m} />
      </div>

      <PipelineBoard initialDeals={d} members={m} />
    </div>
  )
}
