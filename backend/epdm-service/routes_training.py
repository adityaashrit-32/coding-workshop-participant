"""
Training record routes.
Permissions:
  GET            → all authenticated roles
  POST           → hr, manager
  DELETE         → hr, manager
"""

from auth import require_auth, ALL_ROLES, CAN_WRITE
from db import get_conn
from response import (
    error, no_content, not_found, ok,
    parse_body, get_path_param, get_query_param, server_error
)

COLS = ["id", "employee_id", "title", "provider", "completed_date",
        "duration_hours", "competency_id", "notes", "created_at"]


def _row(r):
    return {COLS[i]: r[i] for i in range(len(COLS))}


def list_training(event):
    require_auth(event, ALL_ROLES)
    emp_id = get_query_param(event, "employee_id")
    conn = get_conn()
    with conn.cursor() as cur:
        if emp_id:
            cur.execute(
                f"SELECT {','.join(COLS)} FROM training_records "
                f"WHERE employee_id = %s ORDER BY completed_date DESC",
                (emp_id,),
            )
        else:
            cur.execute(
                f"SELECT {','.join(COLS)} FROM training_records ORDER BY completed_date DESC"
            )
        return ok([_row(r) for r in cur.fetchall()])


def get_training(event):
    require_auth(event, ALL_ROLES)
    tid = get_path_param(event, "id")
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT {','.join(COLS)} FROM training_records WHERE id = %s", (tid,)
        )
        row = cur.fetchone()
    return ok(_row(row)) if row else not_found("Training record")


def create_training(event):
    require_auth(event, CAN_WRITE)
    body   = parse_body(event)
    emp_id = body.get("employee_id")
    title  = (body.get("title") or "").strip()
    if not emp_id or not title:
        return error("employee_id and title are required")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO training_records
                   (employee_id, title, provider, completed_date, duration_hours, competency_id, notes)
                   VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                (emp_id, title, body.get("provider"), body.get("completed_date"),
                 body.get("duration_hours"), body.get("competency_id"), body.get("notes")),
            )
            tid = str(cur.fetchone()[0])
        conn.commit()
    except Exception as e:
        conn.rollback()
        return server_error(e)

    return get_training({**event, "pathParameters": {"id": tid}})


def delete_training(event):
    require_auth(event, CAN_WRITE)          # both hr and manager may delete training records
    tid = get_path_param(event, "id")
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("DELETE FROM training_records WHERE id = %s", (tid,))
        if cur.rowcount == 0:
            conn.rollback()
            return not_found("Training record")
    conn.commit()
    return no_content()
