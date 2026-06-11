"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { updateAppointmentStatusAction } from "@/lib/actions/appointments";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import type { AppointmentStatus } from "@/types/database";

/** Cliente só confirma ou cancela (a action restringe a transição). */
export function AppointmentClientActions({
  appointmentId,
  clientId,
  status,
}: {
  appointmentId: string;
  clientId: string;
  status: AppointmentStatus;
}) {
  const [pending, startTransition] = useTransition();

  if (status !== "scheduled" && status !== "confirmed") return null;

  function update(next: "confirmed" | "cancelled", message: string) {
    const fd = new FormData();
    fd.set("id", appointmentId);
    fd.set("client_id", clientId);
    fd.set("status", next);
    startTransition(async () => {
      await updateAppointmentStatusAction(fd);
      toast.success(message);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {status === "scheduled" ? (
        <Button size="sm" variant="primary" disabled={pending} onClick={() => update("confirmed", "Agendamento confirmado.")}>
          <Check /> Confirmar
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          if (window.confirm("Cancelar este agendamento?")) update("cancelled", "Agendamento cancelado.");
        }}
      >
        <X /> Cancelar
      </Button>
    </div>
  );
}
