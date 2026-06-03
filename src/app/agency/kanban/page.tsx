import { createClient } from '@/lib/supabase/server'
import { type Task, type Client, type AppUser } from '@/types'
import KanbanBoard from './kanban-board'
import AddTaskModal from './add-task-modal'

export default async function KanbanPage() {
  const supabase = await createClient()

  const [{ data: tasks }, { data: clients }, { data: members }] = await Promise.all([
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, business_name').order('business_name'),
    supabase.from('app_users').select('id, name').in('user_type', ['agency_owner', 'agency_staff']),
  ])

  const t = (tasks as Task[]) ?? []
  const c = (clients as Pick<Client, 'id' | 'business_name'>[]) ?? []
  const m = (members as Pick<AppUser, 'id' | 'name'>[]) ?? []

  return (
    <div className="p-8 space-y-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Kanban</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t.length} tarefas</p>
        </div>
        <AddTaskModal clients={c} members={m} />
      </div>

      <KanbanBoard initialTasks={t} clients={c} members={m} />
    </div>
  )
}
