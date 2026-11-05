# -*- coding: utf-8 -*-
"""Issue an offline license key for a customer.

Usage:
  python scripts/make_license.py --email buyer@example.com --name "홍길동" --plan pro
  python scripts/make_license.py --email buyer@example.com --days 365 --out key.txt

Keys are signed with secrets/license_private.pem and verified in the browser
with the embedded public key. No server is required.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import json
import pathlib
import secrets
from typing import Any

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec

BASE = pathlib.Path(__file__).resolve().parent.parent
PRIVATE_KEY = BASE / "secrets" / "license_private.pem"


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def issue(private_key: ec.EllipticCurvePrivateKey, payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    signature = private_key.sign(raw, ec.ECDSA(hashes.SHA256()))
    return f"MH1.{b64url(raw)}.{b64url(signature)}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Issue a 매물한장 license key")
    parser.add_argument("--email", required=True, help="Buyer email")
    parser.add_argument("--name", default="", help="Buyer name (optional)")
    parser.add_argument("--plan", default="pro", choices=["pro", "beta", "team"])
    parser.add_argument("--days", type=int, default=0, help="Validity in days; 0 = lifetime")
    parser.add_argument("--order", default="", help="Order / receipt reference")
    parser.add_argument("--out", default="", help="Write the key to this file")
    args = parser.parse_args()

    if not PRIVATE_KEY.exists():
        raise SystemExit("Missing secrets/license_private.pem. Run scripts/gen_keys.py first.")

    private_key = serialization.load_pem_private_key(PRIVATE_KEY.read_bytes(), password=None)
    if not isinstance(private_key, ec.EllipticCurvePrivateKey):
        raise SystemExit("The private key is not an EC key.")

    today = dt.date.today()
    payload: dict[str, Any] = {
        "v": 1,
        "plan": args.plan,
        "email": args.email.strip().lower(),
        "name": args.name.strip(),
        "issued": today.isoformat(),
        "exp": (today + dt.timedelta(days=args.days)).isoformat() if args.days else None,
        "order": args.order.strip() or f"MH-{today.strftime('%y%m%d')}-{secrets.token_hex(3).upper()}",
    }
    key = issue(private_key, payload)

    print("Plan :", payload["plan"])
    print("Email:", payload["email"])
    print("Exp  :", payload["exp"] or "lifetime")
    print("Order:", payload["order"])
    print()
    print(key)

    if args.out:
        out = pathlib.Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(key + "\n", encoding="utf-8")
        print("\nSaved to", out)


if __name__ == "__main__":
    main()
