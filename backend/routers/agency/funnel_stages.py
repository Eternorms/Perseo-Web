import unicodedata
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from deps import get_db, current_agency_user
from database.db import _Conn

router = APIRouter(prefix="/api/agency/clients", tags=["agency-funnel-stages"])


def _slugify(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text)
    ascii_text = "".join(c for c in normalized if unicodedata.category(c) != "Mn")
    return ascii_text.lower().replace(" ", "_").strip("_")


@router.get("/{client_id}/funnel-stages")
def list_funnel_stages(
    client_id: int,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    rows = db.execute(
        "SELECT id, client_id, value, label, color, position "
        "FROM client_funnel_stages WHERE client_id = %s ORDER BY position ASC",
        [client_id],
    ).fetchall()
    db.commit()
    return [dict(r) for r in rows]


class CreateStageBody(BaseModel):
    label: str
    color: Optional[str] = "zinc"
    position: Optional[int] = None


@router.post("/{client_id}/funnel-stages", status_code=201)
def create_funnel_stage(
    client_id: int,
    body: CreateStageBody,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    value = _slugify(body.label)
    if not value:
        raise HTTPException(status_code=422, detail="Label inválido")

    if body.position is None:
        row = db.execute(
            "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos "
            "FROM client_funnel_stages WHERE client_id = %s",
            [client_id],
        ).fetchone()
        position = row["next_pos"] if row else 0
    else:
        position = body.position

    cur = db.execute(
        "INSERT INTO client_funnel_stages (client_id, value, label, color, position) "
        "VALUES (%s, %s, %s, %s, %s) RETURNING id",
        [client_id, value, body.label, body.color, position],
    )
    new_id = cur.fetchone()["id"]
    db.commit()
    return {"id": new_id, "value": value}


class UpdateStageBody(BaseModel):
    label: Optional[str] = None
    color: Optional[str] = None
    position: Optional[int] = None


@router.patch("/{client_id}/funnel-stages/{stage_id}")
def update_funnel_stage(
    client_id: int,
    stage_id: int,
    body: UpdateStageBody,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    updates: dict = {}
    if body.label is not None:
        updates["label"] = body.label
    if body.color is not None:
        updates["color"] = body.color
    if body.position is not None:
        updates["position"] = body.position
    if not updates:
        return {"ok": True}

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    db.execute(
        f"UPDATE client_funnel_stages SET {set_clause} "
        f"WHERE id = %s AND client_id = %s",
        [*updates.values(), stage_id, client_id],
    )
    db.commit()
    return {"ok": True}


@router.delete("/{client_id}/funnel-stages/{stage_id}", status_code=204)
def delete_funnel_stage(
    client_id: int,
    stage_id: int,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    stage = db.execute(
        "SELECT value FROM client_funnel_stages WHERE id = %s AND client_id = %s",
        [stage_id, client_id],
    ).fetchone()
    if not stage:
        raise HTTPException(status_code=404, detail="Etapa não encontrada")

    client = db.execute(
        "SELECT stage FROM clients WHERE id = %s", [client_id]
    ).fetchone()
    if client and client["stage"] == stage["value"]:
        raise HTTPException(
            status_code=409,
            detail="Não é possível excluir a etapa atual do cliente",
        )

    db.execute(
        "DELETE FROM client_funnel_stages WHERE id = %s AND client_id = %s",
        [stage_id, client_id],
    )
    db.commit()
