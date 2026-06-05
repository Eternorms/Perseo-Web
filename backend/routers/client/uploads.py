from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import Optional
from deps import get_db, current_client
from database.db import _Conn
import tempfile, os, sys

router = APIRouter(prefix="/api/client/uploads", tags=["client-uploads"])


@router.post("", status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    upload_type: str = Form(default="campaign_material"),
    notes: Optional[str] = Form(default=None),
    client: dict = Depends(current_client),
    db: _Conn = Depends(get_db),
):
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "app"))

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Arquivo muito grande (máx 50MB)")

    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename or "")[1]) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        import config  # noqa
        from services.drive_service import DriveService

        svc = DriveService()
        folder_row = db.execute(
            "SELECT folder_id FROM drive_folders WHERE key = %s",
            [f"client_{client['client_id']}"],
        ).fetchone()
        folder_id = folder_row["folder_id"] if folder_row else None

        result = svc.upload_file(
            tmp_path,
            name=f"[CLIENTE] {file.filename}",
            folder_id=folder_id,
            mime_type=file.content_type or "application/octet-stream",
        )
        drive_file_id = result.get("id")
        drive_link = f"https://drive.google.com/file/d/{drive_file_id}/view"
    except Exception as e:
        drive_file_id = None
        drive_link = None
    finally:
        os.unlink(tmp_path)

    db.execute(
        """INSERT INTO client_uploads (client_id, filename, drive_file_id, drive_link, upload_type, notes)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        [client["client_id"], file.filename, drive_file_id, drive_link, upload_type, notes],
    )
    db.commit()
    return {"ok": True, "drive_link": drive_link}


@router.get("")
def list_uploads(
    client: dict = Depends(current_client),
    db: _Conn = Depends(get_db),
):
    rows = db.execute(
        "SELECT * FROM client_uploads WHERE client_id = %s ORDER BY created_at DESC",
        [client["client_id"]],
    ).fetchall()
    db.commit()
    return [dict(r) for r in rows]
