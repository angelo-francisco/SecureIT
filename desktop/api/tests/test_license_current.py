async def test_current_found(test_client, make_store_payload):
    payload = make_store_payload(user_id="current-found")
    await test_client.post("/api/license/store", json=payload)

    resp = await test_client.get(
        "/api/license/current", params={"user_id": "current-found"}
    )
    data = resp.json()
    assert data["exists"] is True
    assert data["license_id"] is not None
    assert data["license_key"] == payload["license_key"]
    assert data["license_type"] == payload["license_type"]
    assert data["max_cameras"] == payload["max_cameras"]
    assert data["max_people"] == payload["max_people"]
    assert data["features"] == payload["features"]
    assert data["status"] == "ACTIVE"
    assert data["days_remaining"] > 0
    assert "activated_at" in data
    assert "expires_at" in data


async def test_current_not_found(test_client):
    resp = await test_client.get(
        "/api/license/current", params={"user_id": "no-such-user"}
    )
    data = resp.json()
    assert data["exists"] is False
