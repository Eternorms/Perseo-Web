from fastapi import APIRouter, Depends, Response, Cookie
from typing import Optional
from deps import get_db, current_client
from database.db import _Conn

router = APIRouter(prefix="/api/client", tags=["client-portal"])


@router.post("/auth")
def client_auth(token: str, response: Response, db: _Conn = Depends(get_db)):
    row = db.execute(
        "SELECT id FROM client_portal_tokens WHERE token = %s AND (expires_at IS NULL OR expires_at > NOW())",
        [token],
    ).fetchone()
    db.commit()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Token inválido")
    response.set_cookie("client_token", token, httponly=True, samesite="lax", max_age=30 * 24 * 3600)
    return {"ok": True}


@router.get("/me")
def get_me(client: dict = Depends(current_client), db: _Conn = Depends(get_db)):
    row = db.execute(
        """SELECT id, name, brand, niche, plan, stage,
                  monthly_budget, current_roas, current_cpa, plan_value,
                  product_description, usp, client_email, client_whatsapp
           FROM clients WHERE id = %s""",
        [client["client_id"]],
    ).fetchone()
    db.commit()
    return dict(row) if row else {}


@router.get("/metrics")
def get_metrics(
    days: int = 30,
    client: dict = Depends(current_client),
    db: _Conn = Depends(get_db),
):
    row = db.execute(
        """SELECT
               COALESCE(SUM(spend), 0)       AS total_spend,
               COALESCE(AVG(roas), 0)        AS avg_roas,
               COALESCE(AVG(cpa), 0)         AS avg_cpa,
               COALESCE(SUM(impressions), 0) AS total_impressions,
               COALESCE(SUM(clicks), 0)      AS total_clicks
           FROM campaign_results
           WHERE client_id = %s
             AND date_start >= (CURRENT_DATE - INTERVAL '%s days')::TEXT""",
        [client["client_id"], days],
    ).fetchone()
    db.commit()
    return dict(row) if row else {}


@router.get("/notifications")
def get_notifications(
    unread_only: bool = False,
    client: dict = Depends(current_client),
    db: _Conn = Depends(get_db),
):
    sql = "SELECT * FROM notifications WHERE client_id = %s"
    params = [client["client_id"]]
    if unread_only:
        sql += " AND read_at IS NULL"
    sql += " ORDER BY created_at DESC LIMIT 30"
    rows = db.execute(sql, params).fetchall()
    db.commit()
    return [dict(r) for r in rows]


@router.patch("/notifications/{notif_id}/read")
def mark_read(
    notif_id: int,
    client: dict = Depends(current_client),
    db: _Conn = Depends(get_db),
):
    db.execute(
        "UPDATE notifications SET read_at = NOW() WHERE id = %s AND client_id = %s",
        [notif_id, client["client_id"]],
    )
    db.commit()
    return {"ok": True}
