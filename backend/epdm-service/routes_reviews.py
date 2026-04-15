"""
Performance review routes: CRUD on /reviews
Permissions:
  GET            → all authenticated roles
  POST, PUT      → hr, manager
  DELETE         → hr only
"""

from auth import require_auth, ALL_ROLES, CAN_WRITE, CAN_DELETE
from db import get_conn
from response import (
    error, no_content, not_found, ok,
    parse_body, get_path_param, get_query_param, server_error
)

COLS = ["id", "employee_id", "reviewer_id", "period", "rating",
        "comments", "status", "created_at", "updated_at"]


def _row(row):
    return {COLS[i]: row[i] for i in range(len(COLS))}


def list_reviews(event):
    require_auth(event, ALL_ROLES)
    emp_id = get_query_param(event, "employee_id")
    conn = get_conn()
    with conn.cursor() as cur:
        if emp_id:
            cur.execute(
                f"SELECT {','.join(COLS)} FROM performance_reviews "
                f"WHERE employee_id = %s ORDER BY created_at DESC",
                (emp_id,),
            )
        else:
            cur.execute(
                f"SELECT {','.join(COLS)} FROM performance_reviews ORDER BY created_at DESC"
            )
        rows = cur.fetchall()
    return ok([_row(r) for r in rows])


def get_review(event):
    require_auth(event, ALL_ROLES)
    rid = get_path_param(event, "id")
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(f"SELECT {','.join(COLS)} FROM performance_reviews WHERE id = %s", (rid,))
        row = cur.fetchone()
    return ok(_row(row)) if row else not_found("Review")


def create_review(event):
    require_auth(event, CAN_WRITE)
    body   = parse_body(event)
    emp_id = body.get("employee_id")
    period = (body.get("period") or "").strip()
    if not emp_id or not period:
        return error("employee_id and period are required")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO performance_reviews
                   (employee_id, reviewer_id, period, rating, comments, status)
                   VALUES (%s,%s,%s,%s,%s,%s) RETURNING id""",
                (emp_id, body.get("reviewer_id"), period,
                 body.get("rating"), body.get("comments"),
                 body.get("status", "draft")),
            )
            rid = str(cur.fetchone()[0])
        conn.commit()
    except Exception as e:
        conn.rollback()
        return server_error(e)

    return get_review({**event, "pathParameters": {"id": rid}})


def update_review(event):
    require_auth(event, CAN_WRITE)
    rid    = get_path_param(event, "id")
    body   = parse_body(event)
    fields = {k: v for k, v in body.items()
              if k in ("period", "rating", "comments", "status", "reviewer_id")}
    if not fields:
        return error("No updatable fields provided")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            set_clause = ", ".join(f"{k} = %s" for k in fields)
            cur.execute(
                f"UPDATE performance_reviews SET {set_clause}, updated_at = NOW() WHERE id = %s",
                list(fields.values()) + [rid],
            )
            if cur.rowcount == 0:
                return not_found("Review")
        conn.commit()
    except Exception as e:
        conn.rollback()
        return server_error(e)

    return get_review(event)


def delete_review(event):
    require_auth(event, CAN_DELETE)
    rid = get_path_param(event, "id")
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("DELETE FROM performance_reviews WHERE id = %s", (rid,))
        if cur.rowcount == 0:
            conn.rollback()
            return not_found("Review")
    conn.commit()
    return no_content()
