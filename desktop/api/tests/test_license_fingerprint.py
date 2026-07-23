import re


async def test_fingerprint_endpoint(test_client):
    resp = await test_client.get("/api/license/fingerprint")
    assert resp.status_code == 200
    data = resp.json()
    assert "fingerprint" in data
    fp = data["fingerprint"]
    assert len(fp) == 64
    assert re.fullmatch(r"[0-9a-f]{64}", fp) is not None
