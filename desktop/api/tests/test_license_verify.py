from datetime import datetime, timedelta, timezone


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
        json={"user_id": "verify-days", "hardware_fingerprint": payload["hardware_fingerprint"]},
    )
    data = resp.json()
    assert data["valid"] is True
    assert data["days_remaining"] >= 29
    assert data["days_remaining"] <= 30
