"""
JWT-based authentication utilities.
Uses HS256 with a secret from environment variable JWT_SECRET.
"""

import hashlib
import hmac
import json
import logging
import os
import time
from base64 import urlsafe_b64decode, urlsafe_b64encode

logger = logging.getLogger(__name__)

JWT_SECRET = os.getenv("JWT_SECRET", "epdm-dev-secret-change-in-prod")
JWT_EXPIRY = int(os.getenv("JWT_EXPIRY_SECONDS", "86400"))  # 24 h


def _b64url(data: bytes) -> str:
    return urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    return urlsafe_b64decode(s + "=" * padding)


def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    h = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"{salt}:{h}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, h = stored.split(":", 1)
        return hmac.compare_digest(
            hashlib.sha256(f"{salt}{password}".encode()).hexdigest(), h
        )
    except Exception:
        return False


def create_token(user_id: str, email: str, role: str) -> str:
    header = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64url(
        json.dumps(
            {
                "sub": user_id,
                "email": email,
                "role": role,
                "iat": int(time.time()),
                "exp": int(time.time()) + JWT_EXPIRY,
            }
        ).encode()
    )
    sig = _b64url(
        hmac.new(
            JWT_SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256
        ).digest()
    )
    return f"{header}.{payload}.{sig}"


def decode_token(token: str) -> dict:
    try:
        header, payload, sig = token.split(".")
        expected = _b64url(
            hmac.new(
                JWT_SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256
            ).digest()
        )
        if not hmac.compare_digest(sig, expected):
            raise ValueError("Invalid signature")
        data = json.loads(_b64url_decode(payload))
        if data.get("exp", 0) < time.time():
            raise ValueError("Token expired")
        return data
    except Exception as e:
        raise ValueError(f"Invalid token: {e}")


# Canonical role sets — use these everywhere instead of inline lists
HR       = "hr"
MANAGER  = "manager"
EMPLOYEE = "employee"

# Convenience permission groups
CAN_WRITE  = [HR, MANAGER]   # POST, PUT
CAN_DELETE = [HR]            # DELETE only
ALL_ROLES  = [HR, MANAGER, EMPLOYEE]

VALID_ROLES = {HR, MANAGER, EMPLOYEE}


def require_auth(event: dict, roles: list = None) -> dict:
    """Extract and validate Bearer token from event headers. Returns claims."""
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    auth = headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise PermissionError("Missing or invalid Authorization header")
    claims = decode_token(auth[7:])
    if roles and claims.get("role") not in roles:
        raise PermissionError(
            f"Role '{claims.get('role')}' is not authorised for this action"
        )
    return claims
