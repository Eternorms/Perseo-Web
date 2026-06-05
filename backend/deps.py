import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "app"))

from fastapi import Depends, HTTPException, Cookie, Header
from typing import Optional, Generator
from auth import decode_agency_token
from database.db import _Conn
from pool import get_pooled_conn, release_conn


def get_db() -> Generator[_Conn, None, None]:
    conn = get_pooled_conn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        release_conn(conn._conn)


def current_agency_user(
    access_token: Optional[str] = Cookie(default=None),
) -> dict:
    if not access_token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    payload = decode_agency_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    return payload


def current_client(
    db: _Conn = Depends(get_db),
    client_token: Optional[str] = Cookie(default=None),
) -> dict:
    if not client_token:
        raise HTTPException(status_code=401, detail="Token de cliente ausente")
    row = db.execute(
        "SELECT cpt.client_id, c.name, c.brand, c.niche "
        "FROM client_portal_tokens cpt "
        "JOIN clients c ON c.id = cpt.client_id "
        "WHERE cpt.token = %s AND (cpt.expires_at IS NULL OR cpt.expires_at > NOW())",
        [client_token],
    ).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Token de cliente inválido")
    return dict(row)


def require_internal(x_api_key: Optional[str] = Header(default=None)) -> None:
    key = os.getenv("INTERNAL_API_KEY", "")
    if not key or x_api_key != key:
        raise HTTPException(status_code=403, detail="Chave interna inválida")
