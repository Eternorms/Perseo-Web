from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from deps import get_db, current_agency_user, require_internal
from database.db import _Conn

router = APIRouter(prefix="/api/agency/approvals", tags=["agency-approvals"])


class SubmitApproval(BaseModel):
    client_id: int
    video_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    media_url: str
    thumbnail_url: Optional[str] = None


@router.get("")
def list_approvals(
    status: Optional[str] = None,
    client_id: Optional[int] = None,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    sql = """SELECT ca.*, c.brand, c.name as client_name
             FROM creative_approvals ca
             JOIN clients c ON c.id = ca.client_id
             WHERE 1=1"""
    params: list = []
    if status:
        sql += " AND ca.status = %s"
        params.append(status)
    if client_id:
        sql += " AND ca.client_id = %s"
        params.append(client_id)
    sql += " ORDER BY ca.submitted_at DESC"
    rows = db.execute(sql, params).fetchall()
    db.commit()
    return [dict(r) for r in rows]


@router.post("", status_code=201)
def submit_approval(
    body: SubmitApproval,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    db.execute(
        """INSERT INTO creative_approvals
           (client_id, video_id, title, description, media_url, thumbnail_url)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        [body.client_id, body.video_id, body.title, body.description,
         body.media_url, body.thumbnail_url],
    )
    db.execute(
        """INSERT INTO notifications (client_id, type, title, body)
           VALUES (%s, %s, %s, %s)""",
        [body.client_id, "creative_ready",
         f"Novo criativo para revisar: {body.title}",
         "Acesse o portal para aprovar ou solicitar ajustes."],
    )
    db.commit()
    return {"ok": True}


@router.get("/{approval_id}")
def get_approval(
    approval_id: int,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    row = db.execute(
        "SELECT * FROM creative_approvals WHERE id = %s",
        [approval_id],
    ).fetchone()
    db.commit()
    if not row:
        raise HTTPException(status_code=404, detail="Aprovação não encontrada")
    return dict(row)
