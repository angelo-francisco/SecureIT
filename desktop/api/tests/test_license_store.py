async def test_store_new_license(test_client, make_store_payload):
    payload = make_store_payload(user_id="store-new")
    resp = await test_client.post("/api/license/store", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "license_id" in data


async def test_store_replaces_existing(test_client, make_store_payload):
    payload1 = make_store_payload(user_id="store-replace", license_id="lic-first")
    await test_client.post("/api/license/store", json=payload1)

    payload2 = make_store_payload(user_id="store-replace", license_id="lic-second")
    await test_client.post("/api/license/store", json=payload2)

    resp = await test_client.get(
        "/api/license/current", params={"user_id": "store-replace"}
    )
    data = resp.json()
    assert data["exists"] is True
    assert data["license_id"] != payload1["license_id"]


async def test_store_all_fields(test_client, make_store_payload, sample_keys):
    payload = make_store_payload(
        user_id="store-fields",
        license_key="KEY1234567890123456789012345",
        license_type="PRO",
        max_cameras=8,
        max_people=25,
        features=["detection", "recording", "alerts"],
        status="ACTIVE",
    )
    resp = await test_client.post("/api/license/store", json=payload)
    assert resp.status_code == 200
    license_id = resp.json()["license_id"]

    resp = await test_client.get(
        "/api/license/current", params={"user_id": "store-fields"}
    )
    data = resp.json()
    assert data["exists"] is True
    assert data["license_id"] == license_id
    assert data["license_key"] == "KEY1234567890123456789012345"
    assert data["license_type"] == "PRO"
    assert data["max_cameras"] == 8
    assert data["max_people"] == 25
    assert data["features"] == ["detection", "recording", "alerts"]
    assert data["status"] == "ACTIVE"
    assert data["days_remaining"] > 0
