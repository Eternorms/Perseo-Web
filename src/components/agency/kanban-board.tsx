"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { CalendarDays, Plus } from "lucide-react";
import { moveTaskAction } from "@/lib/actions/tasks";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/labels";
import { fmtDateShort } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "./task-dialog";
import type { TaskRow, TaskStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const COLUMNS: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "done"];

interface Option {
  id: string;
  name: string;
}

export function KanbanBoard({ tasks, clients, users }: { tasks: TaskRow[]; clients: Option[]; users: Option[] }) {
  const [items, setItems] = React.useState<TaskRow[]>(tasks);
  const [activeTask, setActiveTask] = React.useState<TaskRow | null>(null);
  const [editing, setEditing] = React.useState<TaskRow | null>(null);
  const [creatingIn, setCreatingIn] = React.useState<TaskStatus | null>(null);

  React.useEffect(() => setItems(tasks), [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const byColumn = React.useMemo(() => {
    const map = new Map<TaskStatus, TaskRow[]>(COLUMNS.map((c) => [c, []]));
    for (const t of [...items].sort((a, b) => a.position - b.position)) {
      map.get(t.status)?.push(t);
    }
    return map;
  }, [items]);

  function findTask(id: string) {
    return items.find((t) => t.id === id) ?? null;
  }

  function columnOf(id: string): TaskStatus | null {
    if (COLUMNS.includes(id as TaskStatus)) return id as TaskStatus;
    return findTask(id)?.status ?? null;
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveTask(findTask(String(e.active.id)));
  }

  /** move otimista entre colunas enquanto arrasta */
  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = columnOf(String(active.id));
    const to = columnOf(String(over.id));
    if (!from || !to || from === to) return;

    setItems((prev) => prev.map((t) => (t.id === active.id ? { ...t, status: to } : t)));
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveTask(null);
    if (!over) return;

    const taskId = String(active.id);
    const to = columnOf(String(over.id));
    if (!to) return;

    const column = (byColumn.get(to) ?? []).filter((t) => t.id !== taskId);
    let insertAt = column.length;
    if (!COLUMNS.includes(String(over.id) as TaskStatus)) {
      const overIdx = column.findIndex((t) => t.id === String(over.id));
      if (overIdx >= 0) insertAt = overIdx;
    }

    const before = insertAt > 0 ? column[insertAt - 1].position : null;
    const after = insertAt < column.length ? column[insertAt].position : null;
    const newPos =
      before != null && after != null ? (before + after) / 2 : after != null ? after - 1024 : before != null ? before + 1024 : 1024;

    setItems((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: to, position: newPos } : t)),
    );

    void moveTaskAction({ id: taskId, status: to, beforePosition: before, afterPosition: after });
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid flex-1 grid-cols-1 gap-3 overflow-x-auto pb-4 sm:grid-cols-2 xl:grid-cols-5">
          {COLUMNS.map((col) => (
            <Column
              key={col}
              status={col}
              tasks={byColumn.get(col) ?? []}
              clients={clients}
              onAdd={() => setCreatingIn(col)}
              onEdit={setEditing}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} clients={clients} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        key={editing?.id ?? creatingIn ?? "closed"}
        open={Boolean(editing || creatingIn)}
        onClose={() => {
          setEditing(null);
          setCreatingIn(null);
        }}
        task={editing}
        defaultStatus={creatingIn ?? "backlog"}
        clients={clients}
        users={users}
      />
    </>
  );
}

function Column({
  status,
  tasks,
  clients,
  onAdd,
  onEdit,
}: {
  status: TaskStatus;
  tasks: TaskRow[];
  clients: Option[];
  onAdd: () => void;
  onEdit: (t: TaskRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const def = TASK_STATUS[status];

  return (
    <section
      ref={setNodeRef}
      aria-label={`Coluna ${def.label}`}
      className={cn(
        "flex min-h-64 flex-col rounded-lg border bg-surface-1/60 transition-colors",
        isOver ? "border-neon/40" : "border-line",
      )}
    >
      <header className="flex items-center justify-between gap-2 px-3 py-2.5">
        <h2 className="flex items-center gap-2 text-xs font-medium text-ink">
          {def.label}
          <span className="num rounded-sm bg-surface-3 px-1 text-[10px] text-ink-mute">{tasks.length}</span>
        </h2>
        <Button variant="ghost" size="icon" aria-label={`Nova tarefa em ${def.label}`} onClick={onAdd} className="size-6">
          <Plus />
        </Button>
      </header>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
          {tasks.map((t) => (
            <SortableTask key={t.id} task={t} clients={clients} onEdit={() => onEdit(t)} />
          ))}
          {tasks.length === 0 ? (
            <p className="rounded-md border border-dashed border-line px-3 py-6 text-center text-[11px] text-ink-faint">
              Solte tarefas aqui
            </p>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableTask({ task, clients, onEdit }: { task: TaskRow; clients: Option[]; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(isDragging && "opacity-40")}
    >
      <TaskCard task={task} clients={clients} onClick={onEdit} />
    </div>
  );
}

function TaskCard({
  task,
  clients,
  onClick,
  overlay,
}: {
  task: TaskRow;
  clients: Option[];
  onClick?: () => void;
  overlay?: boolean;
}) {
  const clientName = task.client_id ? clients.find((c) => c.id === task.client_id)?.name : null;
  const priority = TASK_PRIORITY[task.priority];
  const overdue = task.due_date ? new Date(`${task.due_date}T23:59:59`) < new Date() && task.status !== "done" : false;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "cursor-grab rounded-md border border-line bg-surface-2 p-3 text-left shadow-sm transition-colors hover:border-line-strong",
        overlay && "rotate-2 shadow-xl shadow-black/50",
        onClick && "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon",
      )}
    >
      <p className="text-[13px] font-medium leading-snug text-ink">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone={priority.tone}>{priority.label}</Badge>
        {clientName ? <Badge tone="neutral">{clientName}</Badge> : null}
        {task.due_date ? (
          <span className={cn("num flex items-center gap-1 text-[10px]", overdue ? "text-loss" : "text-ink-faint")}>
            <CalendarDays className="size-3" aria-hidden />
            {fmtDateShort(task.due_date)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
