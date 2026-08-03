from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    NoEncryption,
    PrivateFormat,
)

from core.crypto import extract_license_payload, verify_license_token


async def test_verify_valid_token(make_signed_payload):
    token = make_signed_payload({"sub": "user-1", "plan": "pro"})
    result = verify_license_token(token)
    assert result is not None
    assert isinstance(result, dict)
    assert result["iss"] == "secureit-web"
    assert result["sub"] == "user-1"
    assert result["plan"] == "pro"


async def test_verify_invalid_signature(make_signed_payload):
    other_key = Ed25519PrivateKey.generate()
    other_pem = other_key.private_bytes(
        Encoding.PEM, PrivateFormat.PKCS8, NoEncryption()
    )
    from tests.conftest import _make_jwt

    token = _make_jwt(
        other_pem,
        {"iss": "secureit-web", "sub": "user-1"},
    )
    result = verify_license_token(token)
    assert result is None


async def test_verify_wrong_issuer(make_signed_payload):
    token = make_signed_payload({"iss": "wrong-issuer"})
    result = verify_license_token(token)
    assert result is None


async def test_verify_malformed_token():
    result = verify_license_token("not.a.jwt")
    assert result is None


async def test_verify_empty_token():
    result = verify_license_token("")
    assert result is None


async def test_extract_payload_valid(make_signed_payload):
    token = make_signed_payload({"sub": "user-42", "plan": "enterprise"})
    payload = extract_license_payload(token)
    assert payload is not None
    assert payload["iss"] == "secureit-web"
    assert payload["sub"] == "user-42"
    assert payload["plan"] == "enterprise"


async def test_extract_payload_malformed():
    payload = extract_license_payload("totally-broken")
    assert payload is None
