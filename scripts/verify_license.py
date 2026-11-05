# -*- coding: utf-8 -*-
"""Verify a 매물한장 license key locally (for support)."""
from __future__ import annotations

import base64
import json
import pathlib
import sys

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec

BASE = pathlib.Path(__file__).resolve().parent.parent
PRIVATE_KEY = BASE / "secrets" / "license_private.pem"


def b64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python scripts/verify_license.py <key>")
    key = sys.argv[1].strip()
    parts = key.split(".")
    if len(parts) != 3 or parts[0] != "MH1":
        raise SystemExit("Malformed key")
    payload_raw = b64url_decode(parts[1])
    signature = b64url_decode(parts[2])
    private_key = serialization.load_pem_private_key(PRIVATE_KEY.read_bytes(), password=None)
    public_key = private_key.public_key()
    try:
        public_key.verify(signature, payload_raw, ec.ECDSA(hashes.SHA256()))
    except Exception as exc:  # noqa: BLE001
        raise SystemExit(f"INVALID: {exc}") from exc
    print("VALID")
    print(json.dumps(json.loads(payload_raw), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
