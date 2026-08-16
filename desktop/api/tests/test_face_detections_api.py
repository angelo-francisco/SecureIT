from apps.face_detection.models import FaceDetection


async def test_list_face_detections_empty(test_client, auth_headers, clear_data):
    resp = await test_client.get("/api/face-detections", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["results"] == []
    assert data["num_pages"] == 0


async def test_list_face_detections_with_known_filter(
    test_client, auth_headers, clear_data
):
    await FaceDetection.create(
        profile_id=auth_headers["PID"],
        unknown=False,
        name="Maria",
        confidence=0.98,
    )
    await FaceDetection.create(
        profile_id=auth_headers["PID"],
        unknown=True,
        confidence=0.5,
    )
    resp = await test_client.get(
        "/api/face-detections", headers=auth_headers, params={"known_only": "true"}
    )
    results = resp.json()["results"]
    assert len(results) == 1
    assert results[0]["name"] == "Maria"
    assert results[0]["unknown"] is False
