from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from deps import get_db, current_agency_user
from database.db import _Conn
import secrets

router = APIRouter(prefix="/api/agency/clients", tags=["agency-clients"])


@router.get("")
def list_clients(db: _Conn = Depends(get_db), _=Depends(current_agency_user)):
    rows = db.execute("""
        SELECT id, name, brand, niche, plan, stage, active,
               plan_value, monthly_budget, current_roas, current_cpa,
               client_email, client_whatsapp, last_contact_at, created_at
        FROM clients
        WHERE active = 1
        ORDER BY name
    """).fetchall()
    db.commit()
    return [dict(r) for r in rows]


@router.get("/{client_id}")
def get_client(client_id: int, db: _Conn = Depends(get_db), _=Depends(current_agency_user)):
    row = db.execute(
        "SELECT * FROM clients WHERE id = %s AND active = 1",
        [client_id],
    ).fetchone()
    db.commit()
    if not row:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return dict(row)


@router.get("/{client_id}/portal-token")
def get_or_create_portal_token(
    client_id: int,
    label: str = "Principal",
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    row = db.execute(
        "SELECT token FROM client_portal_tokens WHERE client_id = %s AND label = %s",
        [client_id, label],
    ).fetchone()
    if row:
        db.commit()
        return {"token": row["token"]}

    token = secrets.token_urlsafe(32)
    db.execute(
        "INSERT INTO client_portal_tokens (client_id, token, label) VALUES (%s, %s, %s)",
        [client_id, token, label],
    )
    db.commit()
    return {"token": token}


class CreateClientBody(BaseModel):
    name: str
    brand: str
    niche: str
    plan: Optional[str] = "Standard"
    plan_value: Optional[float] = None
    monthly_budget: Optional[float] = None
    client_email: Optional[str] = None
    client_whatsapp: Optional[str] = None
    stage: Optional[str] = "prospect"


@router.post("", status_code=201)
def create_client(
    body: CreateClientBody,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    biz = db.execute(
        "SELECT id FROM businesses WHERE active = 1 ORDER BY id LIMIT 1"
    ).fetchone()
    if not biz:
        raise HTTPException(status_code=500, detail="Nenhum negócio cadastrado no banco")
    cur = db.execute(
        """INSERT INTO clients
           (business_id, name, brand, niche, plan, plan_value, monthly_budget,
            client_email, client_whatsapp, stage, active)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
           RETURNING id""",
        [biz["id"], body.name, body.brand, body.niche, body.plan, body.plan_value,
         body.monthly_budget, body.client_email, body.client_whatsapp, body.stage],
    )
    row = cur.fetchone()
    client_id = row["id"]

    _DEFAULT_STAGES = [
        ("prospect", "Prospect", "blue",    0),
        ("active",   "Ativo",    "emerald", 1),
        ("at_risk",  "Em Risco", "amber",   2),
        ("paused",   "Pausado",  "zinc",    3),
        ("churned",  "Churn",    "red",     4),
    ]
    for value, label, color, position in _DEFAULT_STAGES:
        db.execute(
            "INSERT INTO client_funnel_stages (client_id, value, label, color, position) "
            "VALUES (%s, %s, %s, %s, %s)",
            [client_id, value, label, color, position],
        )

    db.commit()
    return {"id": client_id}


class UpdateClientBody(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    niche: Optional[str] = None
    plan: Optional[str] = None
    stage: Optional[str] = None
    plan_value: Optional[float] = None
    monthly_budget: Optional[float] = None
    client_email: Optional[str] = None
    client_whatsapp: Optional[str] = None
    notes: Optional[str] = None
    last_contact_at: Optional[str] = None

ALLOWED_UPDATE_COLS = {
    "name", "brand", "niche", "plan", "stage",
    "plan_value", "monthly_budget", "client_email",
    "client_whatsapp", "notes", "last_contact_at",
}

@router.patch("/{client_id}")
def update_client(
    client_id: int,
    body: UpdateClientBody,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    updates = {
        k: v for k, v in body.model_dump().items()
        if v is not None and k in ALLOWED_UPDATE_COLS
    }
    if not updates:
        return {"ok": True}
    cols = ", ".join(f"{k} = %s" for k in updates)
    db.execute(
        f"UPDATE clients SET {cols} WHERE id = %s",
        [*updates.values(), client_id],
    )
    db.commit()
    return {"ok": True}
