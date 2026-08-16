import pytest


async def test_requires_profile_headers(test_client):
    resp = await test_client.get("/api/cameras")
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Perfil não encontrado"


async def test_unknown_profile_rejected(test_client):
    resp = await test_client.get(
        "/api/cameras",
        headers={"PID": "nonexistent-profile", "UID": "nonexistent-user"},
    )
    assert resp.status_code == 401


async def test_known_profile_accepted(test_client, auth_headers):
    resp = await test_client.get("/api/cameras", headers=auth_headers)
    assert resp.status_code == 200


async def test_control_add_profile(test_client):
    payload = {"profile_id": "profile-extra", "user_id": "user-extra"}
    resp = await test_client.post("/api/control/add-profile", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["profile_id"] == "profile-extra"
    assert data["user_id"] == "user-extra"
    assert data["created"] is True

    resp = await test_client.post("/api/control/add-profile", json=payload)
    assert resp.status_code == 201
    assert resp.json()["created"] is False
