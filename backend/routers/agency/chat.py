import asyncio
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from deps import get_db, current_agency_user
from database.db import _Conn

router = APIRouter(prefix="/api/agency/chat", tags=["agency-chat"])


class SendMessage(BaseModel):
    content: str
    sender_name: str = "Perseo"


@router.get("/{client_id}/messages")
def get_messages(
    client_id: int,
    limit: int = 50,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    rows = db.execute(
        """SELECT * FROM chat_messages
           WHERE client_id = %s
           ORDER BY created_at DESC LIMIT %s""",
        [client_id, limit],
    ).fetchall()
    db.commit()
    db.execute(
        "UPDATE chat_messages SET read_at = NOW() WHERE client_id = %s AND sender_type = 'client' AND read_at IS NULL",
        [client_id],
    )
    db.commit()
    return list(reversed([dict(r) for r in rows]))


@router.post("/{client_id}/messages", status_code=201)
def send_message(
    client_id: int,
    body: SendMessage,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    db.execute(
        "INSERT INTO chat_messages (client_id, sender_type, sender_name, content) VALUES (%s, 'agency', %s, %s)",
        [client_id, body.sender_name, body.content],
    )
    db.commit()
    return {"ok": True}


@router.get("/{client_id}/stream")
async def stream_messages(
    client_id: int,
    request: Request,
    _=Depends(current_agency_user),
):
    async def event_generator():
        import config  # noqa
        from database.db import get_connection
        last_id = 0
        while True:
            if await request.is_disconnected():
                break
            conn = get_connection()
            rows = conn.execute(
                "SELECT id, sender_type, sender_name, content, created_at FROM chat_messages "
                "WHERE client_id = %s AND id > %s ORDER BY id",
                [client_id, last_id],
            ).fetchall()
            conn.commit()
            for r in rows:
                last_id = r["id"]
                import json
                yield f"data: {json.dumps(dict(r), default=str)}\n\n"
            await asyncio.sleep(3)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
