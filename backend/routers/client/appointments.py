from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from deps import get_db, current_client
from database.db import _Conn

router = APIRouter(prefix="/api/client/appointments", tags=["client-appointments"])


class CreateAppointment(BaseModel):
    title: str
    scheduled_at: str  # ISO datetime
    duration_min: int = 60
    notes: Optional[str] = None


@router.get("")
def list_appointments(
    client: dict = Depends(current_client),
    db: _Conn = Depends(get_db),
):
    rows = db.execute(
        "SELECT * FROM appointments WHERE client_id = %s ORDER BY scheduled_at DESC",
        [client["client_id"]],
    ).fetchall()
    db.commit()
    return [dict(r) for r in rows]


@router.post("", status_code=201)
def create_appointment(
    body: CreateAppointment,
    client: dict = Depends(current_client),
    db: _Conn = Depends(get_db),
):
    db.execute(
        """INSERT INTO appointments (client_id, title, scheduled_at, duration_min, notes)
           VALUES (%s, %s, %s, %s, %s)""",
        [client["client_id"], body.title, body.scheduled_at, body.duration_min, body.notes],
    )
    db.commit()
    return {"ok": True}


@router.patch("/{appt_id}/cancel")
def cancel_appointment(
    appt_id: int,
    client: dict = Depends(current_client),
    db: _Conn = Depends(get_db),
):
    row = db.execute(
        "SELECT id FROM appointments WHERE id = %s AND client_id = %s",
        [appt_id, client["client_id"]],
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    db.execute("UPDATE appointments SET status = 'cancelled' WHERE id = %s", [appt_id])
    db.commit()
    return {"ok": True}
