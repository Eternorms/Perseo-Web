import { type Client, type Task } from '@/types'

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'm1', name: 'Juliana Ferreira', business_name: 'Clínica Bella Forma',
    niche: 'Estética', status: 'active', plan: 'growth', agent_active: true,
    onboarding_step: 7, monthly_value: 2800,
    whatsapp_type: 'evolution', whatsapp_instance: 'bella-forma', whatsapp_phone: '5511991110001',
    meta_page_id: '123456', meta_form_id: '654321', calendar_id: null,
    agent_prompt: null, contact_name: 'Juliana Ferreira',
    contact_phone: '11991110001', contact_email: 'contato@bellaforma.com.br',
    created_at: '2026-04-10T10:00:00Z', updated_at: '2026-05-01T10:00:00Z',
  },
  {
    id: 'm2', name: 'Dr. Rafael Silva', business_name: 'Dr. Silva Dermatologia',
    niche: 'Dermatologia', status: 'active', plan: 'scale', agent_active: true,
    onboarding_step: 7, monthly_value: 4500,
    whatsapp_type: 'evolution', whatsapp_instance: 'drsilva-derm', whatsapp_phone: '5511992220002',
    meta_page_id: '234567', meta_form_id: '765432', calendar_id: 'cal_drsilva',
    agent_prompt: null, contact_name: 'Dr. Rafael Silva',
    contact_phone: '11992220002', contact_email: 'agenda@drsilva.com.br',
    created_at: '2026-03-15T10:00:00Z', updated_at: '2026-05-10T10:00:00Z',
  },
  {
    id: 'm3', name: 'Beatriz Costa', business_name: 'Studio Vitalité',
    niche: 'Bem-estar', status: 'onboarding', plan: 'starter', agent_active: false,
    onboarding_step: 3, monthly_value: 1200,
    whatsapp_type: null, whatsapp_instance: null, whatsapp_phone: null,
    meta_page_id: null, meta_form_id: null, calendar_id: null,
    agent_prompt: null, contact_name: 'Beatriz Costa',
    contact_phone: '11993330003', contact_email: 'bia@studiovitalite.com',
    created_at: '2026-05-20T10:00:00Z', updated_at: '2026-05-20T10:00:00Z',
  },
  {
    id: 'm4', name: 'Dra. Ana Lima', business_name: 'Clínica Harmonia Odonto',
    niche: 'Odontologia', status: 'active', plan: 'growth', agent_active: true,
    onboarding_step: 7, monthly_value: 2800,
    whatsapp_type: 'evolution', whatsapp_instance: 'harmonia-odonto', whatsapp_phone: '5511994440004',
    meta_page_id: '345678', meta_form_id: '876543', calendar_id: null,
    agent_prompt: null, contact_name: 'Dra. Ana Lima',
    contact_phone: '11994440004', contact_email: 'admin@harmoniaodonto.com.br',
    created_at: '2026-04-02T10:00:00Z', updated_at: '2026-05-15T10:00:00Z',
  },
  {
    id: 'm5', name: 'Marcos Oliveira', business_name: 'Centro Estético Renove',
    niche: 'Estética', status: 'paused', plan: 'starter', agent_active: false,
    onboarding_step: 7, monthly_value: 1200,
    whatsapp_type: 'evolution', whatsapp_instance: 'renove-est', whatsapp_phone: '5511995550005',
    meta_page_id: '456789', meta_form_id: '987654', calendar_id: null,
    agent_prompt: null, contact_name: 'Marcos Oliveira',
    contact_phone: '11995550005', contact_email: 'contato@centrorenove.com.br',
    created_at: '2026-02-18T10:00:00Z', updated_at: '2026-04-30T10:00:00Z',
  },
  {
    id: 'm6', name: 'Dra. Camila Rocha', business_name: 'Dra. Camila Nutrição',
    niche: 'Nutrição', status: 'onboarding', plan: 'growth', agent_active: false,
    onboarding_step: 5, monthly_value: 2800,
    whatsapp_type: null, whatsapp_instance: null, whatsapp_phone: null,
    meta_page_id: null, meta_form_id: null, calendar_id: null,
    agent_prompt: null, contact_name: 'Dra. Camila Rocha',
    contact_phone: '11996660006', contact_email: 'dra.camila@nutri.com.br',
    created_at: '2026-05-28T10:00:00Z', updated_at: '2026-05-28T10:00:00Z',
  },
]

export interface MockAgentStat {
  client_id: string
  business_name: string
  leadsToday: number
  actionsToday: number
  agent_active: boolean
}

export const MOCK_AGENT_STATS: MockAgentStat[] = [
  { client_id: 'm1', business_name: 'Clínica Bella Forma', leadsToday: 12, actionsToday: 18, agent_active: true },
  { client_id: 'm2', business_name: 'Dr. Silva Dermatologia', leadsToday: 8, actionsToday: 11, agent_active: true },
  { client_id: 'm4', business_name: 'Clínica Harmonia Odonto', leadsToday: 5, actionsToday: 7, agent_active: true },
  { client_id: 'm3', business_name: 'Studio Vitalité', leadsToday: 0, actionsToday: 0, agent_active: false },
  { client_id: 'm6', business_name: 'Dra. Camila Nutrição', leadsToday: 0, actionsToday: 0, agent_active: false },
]

export const MOCK_STATS = {
  mrr: 15300,
  mrrPrev: 13600,
  leadsWeek: 218,
  conversionRate: 38,
  appointmentsWeek: 67,
  agentsActive: 3,
  agentsTotal: 6,
}

export const MOCK_TASKS: Pick<Task, 'id' | 'title' | 'priority' | 'status'>[] = [
  { id: 't1', title: 'Entregar criativos UGC — Bella Forma', priority: 'high', status: 'in_progress' },
  { id: 't2', title: 'Configurar Evolution API — Studio Vitalité', priority: 'high', status: 'todo' },
  { id: 't3', title: 'Relatório mensal — Dr. Silva Dermatologia', priority: 'medium', status: 'todo' },
]
