"""Testes dos endpoints de aprovações de criativos."""


def test_list_approvals_sem_filtro(client):
    res = client.get("/api/agency/approvals")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_list_approvals_filtra_por_status(client):
    res = client.get("/api/agency/approvals?status=pending")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


def test_list_approvals_filtra_por_client_id(client):
    res = client.get("/api/agency/approvals?client_id=1")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


def test_list_approvals_campos_obrigatorios(client):
    res = client.get("/api/agency/approvals")
    if res.json():
        first = res.json()[0]
        for campo in ("id", "client_id", "title", "status"):
            assert campo in first, f"Campo '{campo}' ausente"


def test_submit_approval_retorna_ok(client):
    payload = {
        "client_id": 1,
        "title": "Criativo de teste",
        "media_url": "https://example.com/media.mp4",
    }
    res = client.post("/api/agency/approvals", json=payload)
    assert res.status_code == 201
    assert res.json()["ok"] is True


def test_submit_approval_sem_media_url_falha(client):
    payload = {"client_id": 1, "title": "Sem URL"}
    res = client.post("/api/agency/approvals", json=payload)
    assert res.status_code == 422


def test_get_approval_por_id(client):
    res = client.get("/api/agency/approvals/1")
    assert res.status_code == 200
