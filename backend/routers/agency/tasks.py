from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from deps import get_db, current_agency_user
from database.db import _Conn

router = APIRouter(prefix="/api/agency/tasks", tags=["agency-tasks"])


class CreateTask(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = "medium"
    client_id: Optional[int] = None
    assigned_to: Optional[str] = None


class UpdateTask(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    client_id: Optional[int] = None
    assigned_to: Optional[str] = None


ALLOWED_UPDATE_COLS = {
    "title", "description", "due_date", "priority", "status", "client_id", "assigned_to"
}


@router.get("")
def list_tasks(
    status: Optional[str] = None,
    client_id: Optional[int] = None,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    sql = """SELECT t.*, c.brand as client_brand
             FROM tasks t
             LEFT JOIN clients c ON c.id = t.client_id
             WHERE 1=1"""
    params: list = []
    if status:
        sql += " AND t.status = %s"
        params.append(status)
    if client_id:
        sql += " AND t.client_id = %s"
        params.append(client_id)
    sql += " ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC"
    rows = db.execute(sql, params).fetchall()
    db.commit()
    return [dict(r) for r in rows]


@router.post("", status_code=201)
def create_task(
    body: CreateTask,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    cur = db.execute(
        """INSERT INTO tasks (title, description, due_date, priority, client_id, assigned_to)
           VALUES (%s, %s, %s, %s, %s, %s)
           RETURNING id""",
        [body.title, body.description, body.due_date, body.priority,
         body.client_id, body.assigned_to],
    )
    row = cur.fetchone()
    db.commit()
    return {"id": row["id"]}


@router.patch("/{task_id}")
def update_task(
    task_id: int,
    body: UpdateTask,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    updates = {
        k: v for k, v in body.model_dump().items()
        if v is not None and k in ALLOWED_UPDATE_COLS
    }
    if not updates:
        return {"ok": True}
    set_clause = ", ".join(f"{k} = %s" for k in updates) + ", updated_at = NOW()"
    db.execute(
        f"UPDATE tasks SET {set_clause} WHERE id = %s",
        [*updates.values(), task_id],
    )
    db.commit()
    return {"ok": True}


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: _Conn = Depends(get_db),
    _=Depends(current_agency_user),
):
    db.execute("DELETE FROM tasks WHERE id = %s", [task_id])
    db.commit()
