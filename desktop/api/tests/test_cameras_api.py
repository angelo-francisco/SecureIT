from apps.cameras.models import Camera


async def _camera_id(auth_headers) -> int:
    camera = await Camera.filter(profile_id=auth_headers["PID"]).first()
    return camera.id


WIFI_CAMERA = {
    "name": "Entrada",
    "location": "Portaria",
    "connection_type": "W",
    "connection_info": {"stream_url": "https://example.com/stream.m3u8"},
    "face_recognition": False,
    "task": "D",
}


async def test_create_camera(test_client, auth_headers, clear_data):
    resp = await test_client.post("/api/cameras", json=WIFI_CAMERA, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json() == {}


async def test_create_and_list_cameras(test_client, auth_headers, clear_data):
    await test_client.post("/api/cameras", json=WIFI_CAMERA, headers=auth_headers)
    resp = await test_client.get("/api/cameras", headers=auth_headers)
    assert resp.status_code == 200
    cameras = resp.json()
    assert len(cameras) == 1
    assert cameras[0]["name"] == "Entrada"
    assert cameras[0]["get_name"] == f"CAM-{cameras[0]['id']}"
    assert cameras[0]["location"] == "Portaria"
    assert cameras[0]["connection_type"] == "W"


async def test_get_camera(test_client, auth_headers, clear_data):
    await test_client.post("/api/cameras", json=WIFI_CAMERA, headers=auth_headers)
    cam_id = await _camera_id(auth_headers)
    resp = await test_client.get(f"/api/cameras/{cam_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == cam_id
    assert data["location"] == "Portaria"


async def test_get_camera_other_profile(test_client, auth_headers, clear_data):
    await test_client.post("/api/cameras", json=WIFI_CAMERA, headers=auth_headers)
    cam_id = await _camera_id(auth_headers)
    other_headers = {
        "PID": "other-profile",
        "UID": "other-user",
    }
    await test_client.post(
        "/api/control/add-profile",
        json={"profile_id": other_headers["PID"], "user_id": other_headers["UID"]},
    )
    resp = await test_client.get(f"/api/cameras/{cam_id}", headers=other_headers)
    assert resp.status_code == 404


async def test_update_camera(test_client, auth_headers, clear_data):
    await test_client.post("/api/cameras", json=WIFI_CAMERA, headers=auth_headers)
    cam_id = await _camera_id(auth_headers)
    resp = await test_client.put(
        f"/api/cameras/{cam_id}",
        json={"name": "Renamed", "location": "Hall"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Renamed"
    assert data["location"] == "Hall"


async def test_delete_camera(test_client, auth_headers, clear_data):
    await test_client.post("/api/cameras", json=WIFI_CAMERA, headers=auth_headers)
    cam_id = await _camera_id(auth_headers)
    resp = await test_client.delete(f"/api/cameras/{cam_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == {"message": "deleted"}

    resp = await test_client.get("/api/cameras", headers=auth_headers)
    assert resp.json() == []


async def test_delete_camera_missing(test_client, auth_headers, clear_data):
    resp = await test_client.delete("/api/cameras/999", headers=auth_headers)
    assert resp.status_code == 404
