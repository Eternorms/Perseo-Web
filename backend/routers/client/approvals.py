from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from deps import get_db, current_client
from database.db import _Conn

router = APIRouter(prefix="/api/client/approvals", tags=["client-approvals"])


@router.get("")
def list_approvals(
    status: Optional[str] = None,
    client: dict = Depends(current_client),
    db: _Conn = Depends(get_db),
):
    sql = "SELECT * FROM creative_approvals WHERE client_id = %s"
    params = [client["client_id"]]
    if status:
        sql += " AND status = %s"
        params.append(status)
    sql += " ORDER BY submitted_at DESC"
    rows = db.execute(sql, params).fetchall()
    db.commit()
    return [dict(r) for r in rows]


class DecisionBody(BaseModel):
    status: str  # 'approved' | 'rejected' | 'revision'
    feedback: Optional[str] = None


@router.patch("/{approval_id}")
def decide(
    approval_id: int,
    body: DecisionBody,
    client: dict = Depends(current_client),
    db: _Conn = Depends(get_db),
):
    if body.status not in ("approved", "rejected", "revision"):
        raise HTTPException(status_code=422, detail="Status inválido")

    row = db.execute(
        "SELECT id FROM creative_approvals WHERE id = %s AND client_id = %s",
        [approval_id, client["client_id"]],
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Criativo não encontrado")

    db.execute(
        """UPDATE creative_approvals
           SET status = %s, client_feedback = %s, decided_at = NOW()
           WHERE id = %s""",
        [body.status, body.feedback, approval_id],
    )
    db.commit()
    return {"ok": True}
