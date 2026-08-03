#!/usr/bin/env python3
"""
Generate Ed25519 keypair for SecureIT license signing.

Usage:
    python etc/generate_keys.py

Outputs:
    - ed25519_private.pem (for web server)
    - ed25519_public.pem  (for desktop API)

Place the private key in the web server's env/config.
Place the public key in the desktop API's env/config.

IMPORTANT: Keep the private key SECRET. Never commit it to git.
"""

import base64
import sys
from pathlib import Path

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
except ImportError:
    print("Error: 'cryptography' package not installed.")
    print("Install with: pip install cryptography")
    sys.exit(1)


def main():
    output_dir = Path(__file__).resolve().parent.parent

    private_key = Ed25519PrivateKey.generate()

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")

    public_pem = (
        private_key.public_key()
        .public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        .decode("utf-8")
    )

    private_path = output_dir / "ed25519_private.pem"
    public_path = output_dir / "ed25519_public.pem"

    private_path.write_text(private_pem)
    public_path.write_text(public_pem)

    private_b64 = base64.b64encode(private_pem.encode()).decode()
    public_b64 = base64.b64encode(public_pem.encode()).decode()

    print(f"Private key saved to: {private_path}")
    print(f"Public key saved to:  {public_path}")
    print()
    print("Add to your web server env (private key - NEVER commit it):")
    print(f"  ED25519_PRIVATE_KEY={private_pem.strip()}")
    print()
    print("The public key is not secret. Keep the desktop API in sync by")
    print("setting ED25519_PUBLIC_KEY (inline PEM) in its env/.env or as an")
    print("environment variable.")
    print(f"  ED25519_PUBLIC_KEY={public_pem.strip()}")
    print()

    test_data = b"test license payload verification"
    signature = private_key.sign(test_data)
    try:
        private_key.public_key().verify(signature, test_data)
        print("Verification test: PASSED")
    except Exception as e:
        print(f"Verification test: FAILED - {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
