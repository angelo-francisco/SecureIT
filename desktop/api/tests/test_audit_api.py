from apps.audit.models import AuditLog
from apps.cameras.models import Camera


async def test_list_audit_logs_empty(test_client, auth_headers, clear_data):
    resp = await test_client.get("/api/audit/logs", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["results"] == []
    assert data["num_pages"] == 0


async def test_logs_recorded_after_actions(test_client, auth_headers, clear_data):
    await test_client.post(
        "/api/cameras",
        json={
            "name": "Entrada",
            "location": "Portaria",
            "connection_type": "W",
            "connection_info": {"stream_url": "https://example.com/x.m3u8"},
        },
        headers=auth_headers,
    )
    camera = await Camera.filter(profile_id=auth_headers["PID"]).first()
    resp = await test_client.get("/api/audit/logs", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["num_pages"] == 1
    entry = data["results"][0]
    assert entry["action"] == "create"
    assert entry["entity_type"] == "camera"
    assert entry["entity_id"] == str(camera.id)
    assert entry["profile_id"] == auth_headers["PID"]


async def test_mark_synced(test_client, auth_headers, clear_data):
    log = await AuditLog.create(
        profile_id=auth_headers["PID"],
        action="create",
        entity_type="camera",
        entity_id="1",
    )
    resp = await test_client.post("/api/audit/logs/synced", json={"ids": [log.id]})
    assert resp.status_code == 200
    assert resp.json() == {"message": "marked"}
    assert await AuditLog.filter(id=log.id, synced=True).count() == 1
