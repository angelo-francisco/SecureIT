async def test_dashboard_empty(test_client, auth_headers, clear_data):
    resp = await test_client.get("/api/panel", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == {"cameras": [], "notifications_count": 0}


async def test_get_settings_creates_defaults(test_client, auth_headers, clear_data):
    resp = await test_client.get("/api/settings", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["profile_id"] == auth_headers["PID"]
    assert data["fps"] == 15
    assert data["monitoring_start_time"] == "18:00"
    assert data["monitoring_end_time"] == "07:00"
    assert data["alert_cooldown"] == 5
    assert data["detect_every"] == 3
    assert data["allow_draw"] is True


async def test_update_settings(test_client, auth_headers, clear_data):
    resp = await test_client.put(
        "/api/settings",
        json={
            "fps": 30,
            "monitoring_start_time": "20:30",
            "alert_cooldown": 10,
            "allow_draw": False,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["fps"] == 30
    assert data["monitoring_start_time"] == "20:30"
    assert data["alert_cooldown"] == 10
    assert data["allow_draw"] is False
