import re
from datetime import datetime, timedelta, timezone


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


async def test_fingerprint_endpoint(test_client):
    resp = await test_client.get("/api/license/fingerprint")
    assert resp.status_code == 200
    data = resp.json()
    assert "fingerprint" in data
    fp = data["fingerprint"]
    assert len(fp) == 64
    assert re.fullmatch(r"[0-9a-f]{64}", fp) is not None


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


async def test_verify_valid(test_client, make_store_payload, make_signed_payload):
    fp = "bb" * 32
    payload = make_store_payload(user_id="verify-valid", hardware_fingerprint=fp)
    await test_client.post("/api/license/store", json=payload)

    resp = await test_client.post(
        "/api/license/verify",
        json={"user_id": "verify-valid", "hardware_fingerprint": fp},
    )
    data = resp.json()
    assert data["valid"] is True
    assert data["license_id"] is not None
    assert data["license_key"] is not None
    assert data["license_type"] is not None
    assert data["activated_at"] is not None
    assert data["expires_at"] is not None
    assert data["days_remaining"] > 0
    assert data["status"] == "ACTIVE"


async def test_verify_wrong_fingerprint(test_client, make_store_payload):
    payload = make_store_payload(user_id="verify-fp", hardware_fingerprint="cc" * 32)
    await test_client.post("/api/license/store", json=payload)

    resp = await test_client.post(
        "/api/license/verify",
        json={"user_id": "verify-fp", "hardware_fingerprint": "dd" * 32},
    )
    data = resp.json()
    assert data["valid"] is False
    assert data["reason"] == "fingerprint_mismatch"


async def test_verify_no_license(test_client):
    resp = await test_client.post(
        "/api/license/verify",
        json={"user_id": "nonexistent-user", "hardware_fingerprint": "ee" * 32},
    )
    data = resp.json()
    assert data["valid"] is False
    assert data["reason"] == "no_license"


async def test_verify_returns_days_remaining(test_client, make_store_payload):
    now = datetime.now(timezone.utc)
    payload = make_store_payload(
        user_id="verify-days",
        expires_at=(now + timedelta(days=30)).isoformat(),
    )
    await test_client.post("/api/license/store", json=payload)

    resp = await test_client.post(
        "/api/license/verify",
        json={
            "user_id": "verify-days",
            "hardware_fingerprint": payload["hardware_fingerprint"],
        },
    )
    data = resp.json()
    assert data["valid"] is True
    assert data["days_remaining"] >= 29
    assert data["days_remaining"] <= 30
