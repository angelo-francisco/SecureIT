ROLE_PAYLOAD = {
    "name": "Funcionário",
    "description": "Empregado da loja",
    "fields": [
        {
            "label": "Departamento",
            "field_type": "text",
            "required": True,
            "sort_order": 0,
        },
        {
            "label": "Turno",
            "field_type": "select",
            "options": ["Manhã", "Tarde", "Noite"],
            "sort_order": 1,
        },
    ],
}


async def test_list_roles_empty(test_client, clear_data):
    resp = await test_client.get("/api/people/roles")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_role_with_fields(test_client, clear_data):
    resp = await test_client.post("/api/people/roles", json=ROLE_PAYLOAD)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Funcionário"
    assert len(data["fields"]) == 2
    assert data["fields"][0]["label"] == "Departamento"
    assert data["fields"][0]["required"] is True
    assert data["fields"][1]["field_type"] == "select"
    assert data["fields"][1]["options"] == ["Manhã", "Tarde", "Noite"]


async def test_get_role(test_client, clear_data):
    created = await test_client.post("/api/people/roles", json=ROLE_PAYLOAD)
    role_id = created.json()["id"]
    resp = await test_client.get(f"/api/people/roles/{role_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Funcionário"


async def test_delete_role(test_client, clear_data):
    created = await test_client.post("/api/people/roles", json=ROLE_PAYLOAD)
    role_id = created.json()["id"]
    resp = await test_client.delete(f"/api/people/roles/{role_id}")
    assert resp.status_code == 204
    resp = await test_client.get("/api/people/roles")
    assert resp.json() == []
