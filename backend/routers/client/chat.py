import asyncio
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from deps import get_db, current_client
from database.db import _Conn

router = APIRouter(prefix="/api/client/chat", tags=["client-chat"])


@router.get("/messages")
def get_messages(
    limit: int = 50,
    client: dict = Depends(current_client),
    db: _Conn = Depends(get_db),
):
    rows = db.execute(
        """SELECT * FROM chat_messages WHERE client_id = %s
           ORDER BY created_at DESC LIMIT %s""",
        [client["client_id"], limit],
    ).fetchall()
    db.execute(
        "UPDATE chat_messages SET read_at = NOW() WHERE client_id = %s AND sender_type = 'agency' AND read_at IS NULL",
        [client["client_id"]],
    )
    db.commit()
    return list(reversed([dict(r) for r in rows]))


class SendMessage(BaseModel):
    content: str


@router.post("/messages", status_code=201)
def send_message(
    body: SendMessage,
    client: dict = Depends(current_client),
    db: _Conn = Depends(get_db),
):
    db.execute(
        "INSERT INTO chat_messages (client_id, sender_type, sender_name, content) VALUES (%s, 'client', %s, %s)",
        [client["client_id"], client["name"], body.content],
    )
    db.commit()
    return {"ok": True}


@router.get("/stream")
async def stream_messages(
    request: Request,
    client: dict = Depends(current_client),
):
    client_id = client["client_id"]

    async def event_generator():
        import config  # noqa
        from database.db import get_connection
        import json
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
                yield f"data: {json.dumps(dict(r), default=str)}\n\n"
            await asyncio.sleep(3)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
