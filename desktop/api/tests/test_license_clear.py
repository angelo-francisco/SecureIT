async def test_clear_deletes(test_client, make_store_payload):
    payload = make_store_payload(user_id="clear-delete")
    await test_client.post("/api/license/store", json=payload)

    resp = await test_client.post(
        "/api/license/clear", json={"user_id": "clear-delete"}
    )
    data = resp.json()
    assert data["success"] is True
    assert data["deleted"] is True

    resp = await test_client.post(
        "/api/license/verify",
        json={"user_id": "clear-delete", "hardware_fingerprint": "ff" * 32},
    )
    assert resp.json()["valid"] is False
    assert resp.json()["reason"] == "no_license"


async def test_clear_idempotent(test_client, make_store_payload):
    payload = make_store_payload(user_id="clear-idempotent")
    await test_client.post("/api/license/store", json=payload)

    resp1 = await test_client.post(
        "/api/license/clear", json={"user_id": "clear-idempotent"}
    )
    assert resp1.json()["deleted"] is True

    resp2 = await test_client.post(
        "/api/license/clear", json={"user_id": "clear-idempotent"}
    )
    assert resp2.json()["success"] is True
    assert resp2.json()["deleted"] is False


async def test_clear_nonexistent(test_client):
    resp = await test_client.post(
        "/api/license/clear", json={"user_id": "clear-nobody"}
    )
    data = resp.json()
    assert data["success"] is True
    assert data["deleted"] is False
