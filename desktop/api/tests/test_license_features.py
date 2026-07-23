async def test_features_allowed(test_client, make_store_payload):
    payload = make_store_payload(user_id="features-allowed")
    await test_client.post("/api/license/store", json=payload)

    resp = await test_client.post(
        "/api/license/features",
        json={"user_id": "features-allowed"},
    )
    data = resp.json()
    assert data["allowed"] is True
    assert data["max_cameras"] == payload["max_cameras"]
    assert data["max_people"] == payload["max_people"]
    assert data["features"] == payload["features"]


async def test_features_not_allowed(test_client):
    resp = await test_client.post(
        "/api/license/features",
        json={"user_id": "features-nobody"},
    )
    data = resp.json()
    assert data["allowed"] is False
    assert data["reason"] == "no_license"
