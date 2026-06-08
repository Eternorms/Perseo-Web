"""Testes dos endpoints de tarefas."""


def test_list_tasks_retorna_lista(client):
    res = client.get("/api/agency/tasks")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


def test_list_tasks_filtra_por_status(client):
    res = client.get("/api/agency/tasks?status=todo")
    assert res.status_code == 200


def test_list_tasks_filtra_por_client_id(client):
    res = client.get("/api/agency/tasks?client_id=1")
    assert res.status_code == 200


def test_create_task_retorna_id(client):
    payload = {"title": "Tarefa de teste", "priority": "high"}
    res = client.post("/api/agency/tasks", json=payload)
    assert res.status_code == 201
    assert "id" in res.json()


def test_create_task_sem_titulo_falha(client):
    res = client.post("/api/agency/tasks", json={"priority": "low"})
    assert res.status_code == 422


def test_update_task_status(client):
    res = client.patch("/api/agency/tasks/1", json={"status": "done"})
    assert res.status_code == 200
    assert res.json()["ok"] is True


def test_delete_task(client):
    res = client.delete("/api/agency/tasks/1")
    assert res.status_code == 204
