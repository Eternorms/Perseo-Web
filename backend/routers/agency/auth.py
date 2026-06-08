from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from deps import get_db, current_agency_user
from auth import verify_password, create_agency_token, hash_password
from database.db import _Conn

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginBody(BaseModel):
    email: str
    password: str


class CreateUserBody(BaseModel):
    email: str
    name: str
    password: str
    role: str = "manager"


@router.post("/login")
def login(body: LoginBody, response: Response, db: _Conn = Depends(get_db)):
    row = db.execute(
        "SELECT id, email, name, role, password_hash, active FROM agency_users WHERE email = %s",
        [body.email],
    ).fetchone()
    db.commit()

    if not row or not row["active"] or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    token = create_agency_token(row["id"], row["email"], row["role"])
    response.set_cookie("access_token", token, httponly=True, samesite="lax", max_age=72 * 3600)
    return {"name": row["name"], "email": row["email"], "role": row["role"]}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"ok": True}


@router.get("/me")
def me(user: dict = Depends(current_agency_user)):
    return user


@router.post("/setup", status_code=201)
def setup_first_admin(body: CreateUserBody, db: _Conn = Depends(get_db)):
    """Cria o primeiro admin. Só funciona se não houver nenhum usuário."""
    count = db.execute("SELECT COUNT(*) as n FROM agency_users").fetchone()
    if count and count["n"] > 0:
        raise HTTPException(status_code=403, detail="Setup já realizado")
    hashed = hash_password(body.password)
    db.execute(
        "INSERT INTO agency_users (email, name, password_hash, role) VALUES (%s, %s, %s, 'admin')",
        [body.email, body.name, hashed],
    )
    db.commit()
    return {"ok": True}



@router.post("/users", status_code=201)
def create_user(body: CreateUserBody, db: _Conn = Depends(get_db), user: dict = Depends(current_agency_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Apenas admins podem criar usuários")
    hashed = hash_password(body.password)
    try:
        db.execute(
            "INSERT INTO agency_users (email, name, password_hash, role) VALUES (%s, %s, %s, %s)",
            [body.email, body.name, hashed, body.role],
        )
        db.commit()
    except Exception:
        raise HTTPException(status_code=409, detail="Email já cadastrado")
    return {"ok": True}
