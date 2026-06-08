from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from deps import get_db, current_agency_user, require_internal
from database.db import _Conn

router = APIRouter(prefix="/api/agency/schedule", tags=["agency-schedule"])


class SchedulePost(BaseModel):
    client_id: int
    video_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    media_url: str
    thumbnail_url: Optional[str] = None
    scheduled_at: Optional[str] = None  # ISO datetime, ex: "2026-07-01T14:00:00"


@router.post("", status_code=201)
def schedule_creative(
    body: SchedulePost,
    db: _Conn = Depends(get_db),
    _=Depends(require_internal),
):
    db.execute(
        """INSERT INTO creative_approvals
           (client_id, video_id, title, description, media_url, thumbnail_url, scheduled_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        [body.client_id, body.video_id, body.title, body.description,
         body.media_url, body.thumbnail_url, body.scheduled_at],
    )
    db.execute(
        """INSERT INTO notifications (client_id, type, title, body)
           VALUES (%s, 'creative_ready', %s, 'Acesse o portal para aprovar.')""",
        [body.client_id, f"Criativo pronto: {body.title}"],
    )
    db.commit()
    return {"ok": True}


@router.get("")
def list_scheduled(
    client_id: Optional[int] = None,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    if client_id:
        rows = db.execute(
            """SELECT ca.*, c.brand FROM creative_approvals ca
               JOIN clients c ON c.id = ca.client_id
               WHERE ca.client_id = %s ORDER BY ca.submitted_at DESC""",
            [client_id],
        ).fetchall()
    else:
        rows = db.execute(
            """SELECT ca.*, c.brand FROM creative_approvals ca
               JOIN clients c ON c.id = ca.client_id
               ORDER BY ca.submitted_at DESC LIMIT 100""",
        ).fetchall()
    db.commit()
    return [dict(r) for r in rows]
