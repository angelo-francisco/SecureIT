from apps.notifications.models import Notification


async def test_list_notifications_empty(test_client, auth_headers, clear_data):
    resp = await test_client.get("/api/notifications", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["results"] == []


async def test_list_notifications_excludes_deleted(
    test_client, auth_headers, clear_data
):
    await Notification.create(
        profile_id=auth_headers["PID"],
        title="Movimento",
        description="Movimento detetado",
        level="M",
    )
    await Notification.create(
        profile_id=auth_headers["PID"],
        title="Removida",
        description="x",
        level="L",
        deleted=True,
    )
    resp = await test_client.get("/api/notifications", headers=auth_headers)
    results = resp.json()["results"]
    assert len(results) == 1
    assert results[0]["title"] == "Movimento"
    assert results[0]["level"] == "M"


async def test_delete_notification(test_client, auth_headers, clear_data):
    notification = await Notification.create(
        profile_id=auth_headers["PID"],
        title="Movimento",
        description="Movimento detetado",
        level="M",
    )
    resp = await test_client.delete(
        f"/api/notifications/{notification.id}", headers=auth_headers
    )
    assert resp.status_code == 204

    deleted = await Notification.get(id=notification.id)
    assert deleted.deleted is True

    resp = await test_client.get("/api/notifications", headers=auth_headers)
    assert resp.json()["results"] == []
