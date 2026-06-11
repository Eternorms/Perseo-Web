"use client";

import { useActionState, useEffect } from "react";
import { createTaskAction, deleteTaskAction, updateTaskAction } from "@/lib/actions/tasks";
import type { FormState } from "@/lib/actions/clients";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/labels";
import type { TaskRow, TaskStatus } from "@/types/database";

const INITIAL: FormState = { error: null };

interface Option {
  id: string;
  name: string;
}

export function TaskDialog({
  open,
  onClose,
  task,
  defaultStatus,
  clients,
  users,
}: {
  open: boolean;
  onClose: () => void;
  task: TaskRow | null;
  defaultStatus: TaskStatus;
  clients: Option[];
  users: Option[];
}) {
  const action = task ? updateTaskAction : createTaskAction;
  const [state, formAction, pending] = useActionState(action, INITIAL);

  useEffect(() => {
    if (state.ok) {
      toast.success(task ? "Tarefa atualizada." : "Tarefa criada.");
      onClose();
    }
  }, [state, task, onClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        title={task ? "Editar tarefa" : "Nova tarefa"}
        description={task ? undefined : `Entra na coluna ${TASK_STATUS[defaultStatus].label}.`}
      >
        <form action={formAction} className="flex flex-col gap-4">
          {task ? <input type="hidden" name="id" value={task.id} /> : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tk-title">Título</Label>
            <Input id="tk-title" name="title" required autoFocus defaultValue={task?.title ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tk-desc">Descrição</Label>
            <Textarea id="tk-desc" name="description" rows={3} defaultValue={task?.description ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tk-status">Status</Label>
              <NativeSelect id="tk-status" name="status" defaultValue={task?.status ?? defaultStatus}>
                {Object.entries(TASK_STATUS).map(([value, def]) => (
                  <option key={value} value={value}>
                    {def.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tk-priority">Prioridade</Label>
              <NativeSelect id="tk-priority" name="priority" defaultValue={task?.priority ?? "medium"}>
                {Object.entries(TASK_PRIORITY).map(([value, def]) => (
                  <option key={value} value={value}>
                    {def.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tk-client">Cliente</Label>
              <NativeSelect id="tk-client" name="client_id" defaultValue={task?.client_id ?? ""}>
                <option value="">Interno</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tk-assignee">Responsável</Label>
              <NativeSelect id="tk-assignee" name="assigned_to" defaultValue={task?.assigned_to ?? ""}>
                <option value="">Sem responsável</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tk-due">Prazo</Label>
              <Input id="tk-due" name="due_date" type="date" defaultValue={task?.due_date ?? ""} />
            </div>
          </div>

          {state.error ? (
            <p role="alert" className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
              {state.error}
            </p>
          ) : null}

          <DialogFooter className="justify-between">
            {task ? (
              <Button
                variant="danger"
                size="sm"
                type="submit"
                formAction={(fd) => {
                  void deleteTaskAction(fd);
                  onClose();
                }}
                formNoValidate
              >
                Excluir
              </Button>
            ) : (
              <span />
            )}
            <Button variant="primary" type="submit" disabled={pending}>
              {pending ? "Salvando…" : task ? "Salvar" : "Criar tarefa →"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
