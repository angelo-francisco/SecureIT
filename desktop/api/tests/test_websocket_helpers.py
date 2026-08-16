from apps.license.models import License
from websocket import helpers


async def test_authenticate_known_profile(test_profile):
    assert await helpers.authenticate(test_profile.profile_id) == test_profile.profile_id
    assert await helpers.authenticate(None) is None
    assert await helpers.authenticate("does-not-exist") is None


async def test_check_license_feature_without_license(test_profile, clear_data):
    assert await helpers.check_license_feature(test_profile.profile_id, "face_recognition") is False


async def test_check_license_feature_active(test_profile, make_store_payload, clear_data):
    await License.create(
        **make_store_payload(user_id=test_profile.user_id, features=["face_recognition"])
    )
    assert await helpers.check_license_feature(test_profile.profile_id, "face_recognition") is True


async def test_check_license_feature_variant(test_profile, make_store_payload, clear_data):
    await License.create(
        **make_store_payload(user_id=test_profile.user_id, features=["anlise_comportamental"])
    )
    assert (
        await helpers.check_license_feature(test_profile.profile_id, "analise_comportamental")
        is True
    )
