"""
Test fixtures para o backend Perseo.

Estratégia: mock leve via dependency_overrides.
- get_db → MockConn que retorna dados fixos por query
- current_agency_user → retorna user de teste sem verificar cookie
Sem tocar banco real.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "app"))

import pytest
from unittest.mock import MagicMock
from starlette.testclient import TestClient


# ── Mock do banco ──────────────────────────────────────────────────────────────

class MockCursor:
    def __init__(self, rows):
        self._rows = rows

    def fetchall(self):
        return self._rows

    def fetchone(self):
        return self._rows[0] if self._rows else None


class MockConn:
    """Simula _Conn retornando fixtures estáticas baseadas na query."""

    def __init__(self, fixtures: dict):
        self._fixtures = fixtures  # {keyword: [rows]}
        self._last_insert_id = None

    def execute(self, sql: str, params=None):
        sql_lower = sql.strip().lower()

        # INSERT → retorna id mock
        if sql_lower.startswith("insert"):
            mock = MagicMock()
            mock.fetchone.return_value = {"id": 999}
            return mock

        # UPDATE / DELETE
        if sql_lower.startswith(("update", "delete")):
            return MockCursor([])

        # SELECT — busca fixture por keyword
        for kw, rows in self._fixtures.items():
            if kw in sql_lower:
                return MockCursor(rows)

        return MockCursor([])

    def commit(self):
        pass

    def rollback(self):
        pass


# ── Fixtures de dados ──────────────────────────────────────────────────────────

MOCK_CLIENTS = [
    {
        "id": 1, "name": "João Silva", "brand": "Marca Teste", "niche": "E-commerce",
        "plan": "Standard", "stage": "active", "active": 1,
        "plan_value": 3000.0, "monthly_budget": 5000.0,
        "current_roas": 3.5, "current_cpa": 25.0,
        "client_email": "joao@teste.com", "client_whatsapp": "+5511999999999",
        "last_contact_at": None, "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": 2, "name": "Maria Souza", "brand": "Clinica MS", "niche": "Estética",
        "plan": "Premium", "stage": "prospect", "active": 1,
        "plan_value": 5000.0, "monthly_budget": 8000.0,
        "current_roas": None, "current_cpa": None,
        "client_email": "maria@clinica.com", "client_whatsapp": None,
        "last_contact_at": None, "created_at": "2026-02-01T00:00:00",
    },
]

MOCK_APPROVALS = [
    {
        "id": 1, "client_id": 1, "video_id": None,
        "title": "Anúncio UGC 01", "description": "Teste",
        "media_url": "https://example.com/video.mp4", "thumbnail_url": None,
        "status": "pending", "client_feedback": None,
        "submitted_at": "2026-06-01T10:00:00", "decided_at": None,
        "brand": "Marca Teste", "client_name": "João Silva",
    },
    {
        "id": 2, "client_id": 1, "video_id": None,
        "title": "Anúncio Estático 02", "description": None,
        "media_url": "https://example.com/img.jpg", "thumbnail_url": None,
        "status": "approved", "client_feedback": "Ótimo!",
        "submitted_at": "2026-05-15T09:00:00", "decided_at": "2026-05-16T11:00:00",
        "brand": "Marca Teste", "client_name": "João Silva",
    },
]

MOCK_TASKS = [
    {
        "id": 1, "client_id": 1, "client_brand": "Marca Teste",
        "title": "Criar criativos", "description": None,
        "due_date": "2026-06-15", "priority": "high",
        "status": "todo", "assigned_to": None,
        "created_at": "2026-06-01T00:00:00",
    },
]

MOCK_BUSINESSES = [{"id": 1}]


def make_conn(extra_fixtures: dict | None = None) -> MockConn:
    fixtures = {
        "from clients": MOCK_CLIENTS,
        "from creative_approvals": MOCK_APPROVALS,
        "from tasks": MOCK_TASKS,
        "from businesses": MOCK_BUSINESSES,
    }
    if extra_fixtures:
        fixtures.update(extra_fixtures)
    return MockConn(fixtures)


# ── TestClient factory ─────────────────────────────────────────────────────────

@pytest.fixture
def client():
    """TestClient com dependências mockadas."""
    # Import aqui para evitar efeitos colaterais no módulo level
    import importlib, main as app_module
    from deps import get_db, current_agency_user

    conn = make_conn()

    def override_db():
        yield conn

    def override_user():
        return {"id": 1, "email": "admin@perseo.com", "name": "Admin", "role": "admin"}

    app_module.app.dependency_overrides[get_db] = override_db
    app_module.app.dependency_overrides[current_agency_user] = override_user

    with TestClient(app_module.app) as tc:
        yield tc

    app_module.app.dependency_overrides.clear()
