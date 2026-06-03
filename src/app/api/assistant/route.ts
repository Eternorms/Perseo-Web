import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_client_list',
    description: 'Lista todos os clientes da agência com status, plano e dados de contato',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_leads_summary',
    description: 'Resumo de leads por status para um cliente específico ou todos os clientes',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'UUID do cliente. Omitir para ver todos.' },
      },
      required: [],
    },
  },
  {
    name: 'get_appointments',
    description: 'Lista agendamentos de hoje ou da semana para um cliente',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'UUID do cliente. Omitir para ver todos.' },
        period: { type: 'string', enum: ['today', 'week'], description: 'Período: today ou week' },
      },
      required: [],
    },
  },
  {
    name: 'create_task',
    description: 'Cria uma tarefa no Kanban interno da agência',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título da tarefa' },
        description: { type: 'string', description: 'Descrição opcional' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        client_id: { type: 'string', description: 'UUID do cliente relacionado (opcional)' },
      },
      required: ['title'],
    },
  },
]

async function executeTool(name: string, input: Record<string, string>, createdById: string) {
  const admin = createAdminClient()

  if (name === 'get_client_list') {
    const { data } = await admin.from('clients').select('id, business_name, status, plan, contact_name, contact_phone, agent_active').order('business_name')
    return data ?? []
  }

  if (name === 'get_leads_summary') {
    let query = admin.from('leads').select('client_id, status')
    if (input.client_id) query = query.eq('client_id', input.client_id)
    const { data } = await query
    const summary: Record<string, number> = {}
    for (const l of data ?? []) {
      summary[l.status] = (summary[l.status] ?? 0) + 1
    }
    return { total: data?.length ?? 0, by_status: summary }
  }

  if (name === 'get_appointments') {
    const now = new Date()
    const start = now.toISOString()
    const end = input.period === 'week'
      ? new Date(now.getTime() + 7 * 86400000).toISOString()
      : new Date(now.getTime() + 86400000).toISOString()
    let query = admin.from('appointments').select('patient_name, scheduled_at, status, client_id').gte('scheduled_at', start).lte('scheduled_at', end)
    if (input.client_id) query = query.eq('client_id', input.client_id)
    const { data } = await query.order('scheduled_at')
    return data ?? []
  }

  if (name === 'create_task') {
    const { data, error } = await admin.from('tasks').insert({
      title: input.title,
      description: input.description || null,
      priority: input.priority || 'medium',
      client_id: input.client_id || null,
      created_by: createdById,
      status: 'backlog',
    }).select().single()
    if (error) return { error: error.message }
    return { created: true, task: data }
  }

  return { error: `Tool '${name}' não encontrada.` }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { data: appUser } = await supabase.from('app_users').select('id, user_type').eq('supabase_uid', user.id).single()
    if (!appUser?.user_type?.startsWith('agency')) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const { message } = await request.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })

    const admin = createAdminClient()

    // Salvar mensagem do usuário
    await admin.from('assistant_messages').insert({ role: 'user', content: message })

    // Buscar histórico (últimas 20 mensagens)
    const { data: history } = await admin
      .from('assistant_messages')
      .select('role, content')
      .order('created_at', { ascending: false })
      .limit(20)

    const messages: Anthropic.MessageParam[] = (history ?? [])
      .reverse()
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const systemPrompt = `Você é o assistente IA da Perseo Agency, uma agência que vende AI UGC Ads + Speed-to-Lead Agent para clínicas de estética e saúde no Brasil.

Seu papel é ser um copiloto estratégico para o time da Perseo. Você:
- Tem acesso a dados reais da agência (clientes, leads, agendamentos)
- Pode criar tarefas no Kanban interno
- Responde em português brasileiro
- É direto, conciso e focado em ação
- Quando o usuário pede dados, usa as ferramentas disponíveis em vez de inventar números

Data/hora atual: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`

    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages,
    })

    // Loop de tool use
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of toolUseBlocks) {
        const result = await executeTool(block.name, block.input as Record<string, string>, appUser.id)
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
      }

      messages.push({ role: 'assistant', content: response.content })
      messages.push({ role: 'user', content: toolResults })

      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      })
    }

    const textBlock = response.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined
    const assistantText = textBlock?.text ?? 'Não consegui gerar uma resposta.'

    // Salvar resposta do assistente
    await admin.from('assistant_messages').insert({ role: 'assistant', content: assistantText })

    return NextResponse.json({ message: assistantText })
  } catch (e) {
    console.error('[assistant]', e)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
