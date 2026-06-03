import { getClientContext } from '@/lib/get-client-context'
import { type Client } from '@/types'
import ClientSettingsForm from './settings-form'

export default async function ClientSettingsPage() {
  const { supabase, clientId } = await getClientContext()
  const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single()
  if (!client) return null

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Configurações</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Dados da clínica e configuração do agente</p>
      </div>
      <ClientSettingsForm client={client as Client} />
    </div>
  )
}
