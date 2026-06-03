'use client'

import { useState, useTransition } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { type Task, type TaskStatus, type AppUser, type Client } from '@/types'
import { updateTaskStatusAction, deleteTaskAction } from './actions'

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'A fazer' },
  { id: 'in_progress', label: 'Em progresso' },
  { id: 'review', label: 'Revisão' },
  { id: 'done', label: 'Concluído' },
]

const priorityColor: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-neutral-600/30 text-neutral-400',
}
const priorityLabel: Record<string, string> = { high: 'Alta', medium: 'Média', low: 'Baixa' }

interface Props {
  initialTasks: Task[]
  members: Pick<AppUser, 'id' | 'name'>[]
  clients: Pick<Client, 'id' | 'business_name'>[]
}

export default function KanbanBoard({ initialTasks, members, clients }: Props) {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.business_name]))
  const memberMap = Object.fromEntries(members.map(m => [m.id, m.name]))

  function onDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find(t => t.id === activeId)
    if (!activeTask) return

    const overIsColumn = COLUMNS.some(c => c.id === overId)
    const overTask = tasks.find(t => t.id === overId)
    const newStatus = overIsColumn ? overId as TaskStatus : overTask?.status

    if (newStatus && newStatus !== activeTask.status) {
      setTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: newStatus } : t))
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const task = tasks.find(t => t.id === activeId)
    if (!task) return

    const overIsColumn = COLUMNS.some(c => c.id === overId)
    const overTask = tasks.find(t => t.id === overId)
    const newStatus = overIsColumn ? overId as TaskStatus : overTask?.status

    if (newStatus && newStatus !== initialTasks.find(t => t.id === activeId)?.status) {
      startTransition(async () => {
        await updateTaskStatusAction(activeId, newStatus)
      })
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Deletar esta tarefa?')) return
    setTasks(prev => prev.filter(t => t.id !== id))
    startTransition(async () => { await deleteTaskAction(id) })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          return (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={colTasks}
              clientMap={clientMap}
              memberMap={memberMap}
              onDelete={handleDelete}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={activeTask}
            clientName={activeTask.client_id ? clientMap[activeTask.client_id] : null}
            memberName={activeTask.assigned_to ? memberMap[activeTask.assigned_to] : null}
            onDelete={() => {}}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

function Column({ id, label, tasks, clientMap, memberMap, onDelete }: {
  id: TaskStatus
  label: string
  tasks: Task[]
  clientMap: Record<string, string>
  memberMap: Record<string, string>
  onDelete: (id: string) => void
}) {
  const { setNodeRef } = useSortable({ id, data: { type: 'column' } })

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-64">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{label}</span>
        <span className="text-xs text-neutral-600 bg-neutral-800 rounded-full px-2 py-0.5">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[80px]">
          {tasks.map(task => (
            <SortableTaskCard
              key={task.id}
              task={task}
              clientName={task.client_id ? clientMap[task.client_id] : null}
              memberName={task.assigned_to ? memberMap[task.assigned_to] : null}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

function SortableTaskCard({ task, clientName, memberName, onDelete }: {
  task: Task
  clientName: string | null
  memberName: string | null
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} clientName={clientName} memberName={memberName} onDelete={onDelete} />
    </div>
  )
}

function TaskCard({ task, clientName, memberName, onDelete, isDragging }: {
  task: Task
  clientName: string | null
  memberName: string | null
  onDelete: (id: string) => void
  isDragging?: boolean
}) {
  return (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-2 cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-2xl rotate-1' : 'hover:border-neutral-700'} transition-colors`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-white leading-snug">{task.title}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
          className="text-neutral-600 hover:text-red-400 transition-colors text-xs flex-shrink-0 mt-0.5"
          onPointerDown={e => e.stopPropagation()}
        >
          ×
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-neutral-500 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${priorityColor[task.priority] ?? ''}`}>
          {priorityLabel[task.priority]}
        </span>
        {clientName && (
          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 text-xs truncate max-w-[90px]">
            {clientName}
          </span>
        )}
      </div>

      {(memberName || task.due_date) && (
        <div className="flex items-center justify-between pt-0.5">
          {memberName && <span className="text-xs text-neutral-500">{memberName}</span>}
          {task.due_date && (
            <span className="text-xs text-neutral-600">
              {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
