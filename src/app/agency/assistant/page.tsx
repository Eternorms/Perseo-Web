import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type AssistantMessage } from '@/types'
import ChatUI from './chat-ui'

export default async function AssistantPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let messages: AssistantMessage[] = []
  if (user) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('assistant_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50)
    messages = (data as AssistantMessage[]) ?? []
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-white">Hermes</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Assistente IA com acesso aos dados da agência</p>
      </div>
      <div className="flex-1">
        <ChatUI initialMessages={messages} />
      </div>
    </div>
  )
}
