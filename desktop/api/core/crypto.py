"""
Ed25519 license verification for the desktop API.

The desktop API only VERIFIES signatures (the web server signs).
This module handles JWT parsing and Ed25519 signature verification
using the public key from settings (ED25519_PUBLIC_KEY).
"""

import base64
import json
import logging
from pathlib import Path
from typing import Optional

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import load_pem_public_key

from core.config import settings

logger = logging.getLogger("crypto")

_cached_public_key: Optional[Ed25519PublicKey] = None


def _get_public_key() -> Ed25519PublicKey:
    """Load and cache the Ed25519 public key from PEM file."""
    global _cached_public_key
    if _cached_public_key is not None:
        return _cached_public_key

    pem_data = settings.get_ed25519_public_key().encode("utf-8")
    key = load_pem_public_key(pem_data)

    if not isinstance(key, Ed25519PublicKey):
        raise TypeError(f"Expected Ed25519 public key, got {type(key).__name__}")

    _cached_public_key = key
    return _cached_public_key


def _base64url_decode(data: str) -> bytes:
    """Decode base64url-encoded data with padding."""
    pad = data + "=" * (4 - len(data) % 4)
    return base64.urlsafe_b64decode(pad)


def verify_license_token(token: str) -> Optional[dict]:
    """
    Verify an Ed25519-signed JWT license token.

    Args:
        token: The JWT string (header.payload.signature).

    Returns:
        The decoded payload dict if verification succeeds, None otherwise.
    """
    try:
        if not token:
            logger.warning("verify_license_token: empty token")
            return None

        parts = token.split(".")
        if len(parts) != 3:
            logger.warning(
                "verify_license_token: expected 3 JWT parts, got %d", len(parts)
            )
            return None

        header_b64, payload_b64, signature_b64 = parts

        header = json.loads(_base64url_decode(header_b64))
        alg = header.get("alg")
        logger.info(
            "verify_license_token: header alg=%s, keys_in_header=%s",
            alg,
            list(header.keys()),
        )
        if alg != "EdDSA":
            logger.warning("verify_license_token: expected alg=EdDSA, got %s", alg)
            return None

        public_key = _get_public_key()
        sign_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        signature = _base64url_decode(signature_b64)

        logger.info(
            "verify_license_token: sign_input length=%d, signature length=%d",
            len(sign_input),
            len(signature),
        )

        public_key.verify(signature, sign_input)

        payload = json.loads(_base64url_decode(payload_b64))
        logger.info("verify_license_token: payload iss=%s", payload.get("iss"))

        if payload.get("iss") != "secureit-web":
            logger.warning(
                "verify_license_token: expected iss=secureit-web, got %s",
                payload.get("iss"),
            )
            return None

        logger.info("verify_license_token: SUCCESS")
        return payload

    except Exception as e:
        logger.error("verify_license_token: Exception: %s: %s", type(e).__name__, e)
        return None


def extract_license_payload(token: str) -> Optional[dict]:
    """
    Extract the payload from a JWT token WITHOUT verifying the signature.
    Used for reading license data when verification is not needed
    (e.g., displaying license info).

    WARNING: Never use this for access control decisions.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        return json.loads(_base64url_decode(parts[1]))
    except Exception:
        return None
