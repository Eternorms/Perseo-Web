"""Testes dos endpoints de clientes da agência."""


def test_list_clients_retorna_lista(client):
    res = client.get("/api/agency/clients")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_list_clients_campos_obrigatorios(client):
    res = client.get("/api/agency/clients")
    first = res.json()[0]
    for campo in ("id", "brand", "niche", "plan", "stage"):
        assert campo in first, f"Campo '{campo}' ausente"


def test_get_client_existente(client):
    res = client.get("/api/agency/clients/1")
    assert res.status_code == 200
    data = res.json()
    assert data["brand"] == "Marca Teste"


def test_create_client_retorna_id(client):
    payload = {
        "name": "Novo Cliente",
        "brand": "Nova Marca",
        "niche": "Saúde",
        "plan": "Standard",
    }
    res = client.post("/api/agency/clients", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert isinstance(data["id"], int)


def test_create_client_campos_obrigatorios(client):
    res = client.post("/api/agency/clients", json={"name": "Só nome"})
    assert res.status_code == 422


def test_update_client_retorna_ok(client):
    res = client.patch("/api/agency/clients/1", json={"stage": "active"})
    assert res.status_code == 200
    assert res.json()["ok"] is True


def test_update_client_stage_invalido_nao_quebra(client):
    res = client.patch("/api/agency/clients/1", json={"stage": "inexistente"})
    assert res.status_code == 200
