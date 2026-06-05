import sys, os

# Permite importar services e database do app desktop
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "app"))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "app", ".env"))  # fallback desktop

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from init_db import init_web_db
from pool import init_pool

from routers.agency import auth as agency_auth
from routers.agency import clients as agency_clients
from routers.agency import meta as agency_meta
from routers.agency import approvals as agency_approvals
from routers.agency import schedule as agency_schedule
from routers.agency import chat as agency_chat
from routers.client import portal as client_portal
from routers.client import approvals as client_approvals
from routers.client import chat as client_chat
from routers.client import uploads as client_uploads
from routers.client import appointments as client_appointments

app = FastAPI(title="Perseo Web API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_web_db()
    init_pool()


app.include_router(agency_auth.router)
app.include_router(agency_clients.router)
app.include_router(agency_meta.router)
app.include_router(agency_approvals.router)
app.include_router(agency_schedule.router)
app.include_router(agency_chat.router)
app.include_router(client_portal.router)
app.include_router(client_approvals.router)
app.include_router(client_chat.router)
app.include_router(client_uploads.router)
app.include_router(client_appointments.router)


@app.get("/health")
def health():
    return {"status": "ok"}
