"""
Auth routes: POST /auth/login, POST /auth/register, GET /auth/me
"""

from auth import create_token, hash_password, require_auth, verify_password, VALID_ROLES
from db import get_conn
from response import created, error, not_found, ok, parse_body


def login(event):
    body = parse_body(event)
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    if not email or not password:
        return error("email and password are required")

    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("SELECT id, email, password, role FROM users WHERE email = %s", (email,))
        row = cur.fetchone()

    if not row or not verify_password(password, row[2]):
        return error("Invalid credentials", 401)

    token = create_token(str(row[0]), row[1], row[3])
    return ok({"token": token, "user": {"id": str(row[0]), "email": row[1], "role": row[3]}})


def register(event):
    body = parse_body(event)
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    role = (body.get("role") or "employee").strip().lower()

    if not email or not password:
        return error("email and password are required")
    if role not in VALID_ROLES:
        return error(f"Invalid role. Must be one of: {', '.join(sorted(VALID_ROLES))}")

    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return error("Email already registered", 409)
        cur.execute(
            "INSERT INTO users (email, password, role) VALUES (%s, %s, %s) RETURNING id",
            (email, hash_password(password), role),
        )
        user_id = str(cur.fetchone()[0])
    conn.commit()

    token = create_token(user_id, email, role)
    return created({"token": token, "user": {"id": user_id, "email": email, "role": role}})


def me(event):
    claims = require_auth(event)
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("SELECT id, email, role, created_at FROM users WHERE id = %s", (claims["sub"],))
        row = cur.fetchone()
    if not row:
        return not_found("User")
    return ok({"id": str(row[0]), "email": row[1], "role": row[2], "created_at": row[3]})
