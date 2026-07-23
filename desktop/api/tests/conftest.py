import base64
import json
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
import pytest
import pytest_asyncio
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
)
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    NoEncryption,
    PrivateFormat,
    PublicFormat,
    load_pem_private_key,
)
from tortoise import Tortoise

import core.crypto as crypto_module
from core.config import settings
from main import app

TEST_DATABASE_URL = "postgres://secureit:secureit@localhost:5432/secureit"

TORTOISE_MODELS = [
    "apps.control.models",
    "apps.cameras.models",
    "apps.face_detection.models",
    "apps.notifications.models",
    "apps.panel.models",
    "apps.people.models",
    "apps.audit.models",
    "apps.license.models",
]


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    pad = s + "=" * (4 - len(s) % 4)
    return base64.urlsafe_b64decode(pad)


def _make_jwt(private_key_pem: bytes, payload: dict) -> str:
    header = {"alg": "EdDSA", "kid": "test-key", "typ": "JWT"}
    signing_input = (
        _b64url_encode(json.dumps(header).encode())
        + "."
        + _b64url_encode(json.dumps(payload).encode())
    )
    private_key = load_pem_private_key(private_key_pem, password=None)
    signature = private_key.sign(signing_input.encode())
    return signing_input + "." + _b64url_encode(signature)


@pytest.fixture(scope="session")
def sample_keys():
    private_key = Ed25519PrivateKey.generate()
    private_pem = private_key.private_bytes(
        Encoding.PEM, PrivateFormat.PKCS8, NoEncryption()
    )
    public_pem = private_key.public_key().public_bytes(
        Encoding.PEM, PublicFormat.SubjectPublicKeyInfo
    )
    return private_pem, public_pem


@pytest.fixture(scope="session")
def _setup_public_key(sample_keys):
    tmp_dir = tempfile.mkdtemp()
    pub_path = Path(tmp_dir) / "test_public.pem"
    pub_path.write_bytes(sample_keys[1])

    settings.ED25519_PUBLIC_KEY_PATH = str(pub_path)
    crypto_module._cached_public_key = None

    yield

    pub_path.unlink(missing_ok=True)
    try:
        Path(tmp_dir).rmdir()
    except OSError:
        pass


@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def setup_db(_setup_public_key):
    await Tortoise.init(
        db_url=TEST_DATABASE_URL,
        modules={"models": TORTOISE_MODELS},
    )
    await Tortoise.generate_schemas()

    yield

    await Tortoise.close_connections()


@pytest_asyncio.fixture(loop_scope="session")
async def cleanup(setup_db):
    yield
    from apps.license.models import License

    await License.all().delete()


@pytest_asyncio.fixture(loop_scope="session")
async def test_client(setup_db):
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        yield client


@pytest.fixture
def make_signed_payload(sample_keys, _setup_public_key):
    private_key_pem = sample_keys[0]

    def _make(payload_dict):
        full_payload = {
            "iss": "secureit-web",
            **payload_dict,
        }
        return _make_jwt(private_key_pem, full_payload)

    return _make


@pytest.fixture
def make_store_payload(make_signed_payload, sample_keys):
    def _make(user_id="test-user", **overrides):
        now = datetime.now(timezone.utc)
        payload = {
            "license_id": f"lic-{uuid.uuid4()}",
            "user_id": user_id,
            "license_key": "ABC123DEF456GHI789JKL012MNO",
            "license_type": "STANDARD",
            "activated_at": now.isoformat(),
            "expires_at": (now + timedelta(days=365)).isoformat(),
            "hardware_fingerprint": "aa" * 32,
            "signed_payload": make_signed_payload({"sub": user_id}),
            "public_key": sample_keys[1].decode(),
            "signature": "test-signature",
            "max_cameras": 4,
            "max_people": 10,
            "features": ["detection", "recording"],
            "status": "ACTIVE",
        }
        payload.update(overrides)
        return payload

    return _make
