import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "app"))

from fastapi import APIRouter, Depends, HTTPException
from deps import get_db, current_agency_user
from database.db import _Conn
import httpx

router = APIRouter(prefix="/api/agency/meta", tags=["agency-meta"])

GRAPH_URL = "https://graph.facebook.com/v20.0"


def _get_client_meta(client_id: int, db: _Conn) -> dict:
    row = db.execute(
        "SELECT meta_ad_account_id, meta_token, brand, niche FROM clients WHERE id = %s",
        [client_id],
    ).fetchone()
    db.commit()
    if not row or not row["meta_ad_account_id"] or not row["meta_token"]:
        raise HTTPException(status_code=422, detail="Cliente sem conta Meta configurada")
    return dict(row)


@router.get("/{client_id}/insights")
def get_insights(
    client_id: int,
    days: int = 30,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    meta = _get_client_meta(client_id, db)
    account = meta["meta_ad_account_id"]
    token = meta["meta_token"]

    resp = httpx.get(
        f"{GRAPH_URL}/act_{account}/insights",
        params={
            "fields": "impressions,reach,clicks,spend,actions,ctr,cpm,frequency",
            "date_preset": f"last_{days}_d",
            "level": "account",
            "access_token": token,
        },
        timeout=20,
    )
    data = resp.json()
    if "error" in data:
        raise HTTPException(status_code=502, detail=data["error"].get("message", "Erro Meta API"))
    return data.get("data", [])


@router.get("/{client_id}/adsets")
def get_adsets(
    client_id: int,
    days: int = 7,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    meta = _get_client_meta(client_id, db)
    account = meta["meta_ad_account_id"]
    token = meta["meta_token"]

    resp = httpx.get(
        f"{GRAPH_URL}/act_{account}/insights",
        params={
            "fields": "adset_name,impressions,clicks,spend,cpm,frequency,actions",
            "date_preset": f"last_{days}_d",
            "level": "adset",
            "access_token": token,
        },
        timeout=20,
    )
    data = resp.json()
    if "error" in data:
        raise HTTPException(status_code=502, detail=data["error"].get("message", "Erro Meta API"))

    adsets = data.get("data", [])
    if not adsets:
        return {"adsets": [], "cannibalization": []}

    cpms = [float(a.get("cpm", 0)) for a in adsets]
    avg_cpm = sum(cpms) / len(cpms) if cpms else 0
    cannibalization = [
        a for a in adsets
        if float(a.get("frequency", 0)) > 2.5 and float(a.get("cpm", 0)) > avg_cpm * 1.3
    ]
    return {"adsets": adsets, "cannibalization": cannibalization, "avg_cpm": avg_cpm}


@router.get("/{client_id}/ads")
def get_ads(
    client_id: int,
    days: int = 30,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    meta = _get_client_meta(client_id, db)
    account = meta["meta_ad_account_id"]
    token = meta["meta_token"]

    resp = httpx.get(
        f"{GRAPH_URL}/act_{account}/insights",
        params={
            "fields": "ad_name,ad_id,impressions,clicks,spend,actions,ctr,video_play_curve_actions",
            "date_preset": f"last_{days}_d",
            "level": "ad",
            "access_token": token,
        },
        timeout=20,
    )
    data = resp.json()
    if "error" in data:
        raise HTTPException(status_code=502, detail=data["error"].get("message", "Erro Meta API"))
    return data.get("data", [])
