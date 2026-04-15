"""
Development plan + goal routes.
Permissions:
  GET            → all authenticated roles
  POST, PUT      → hr, manager  (goals: hr, manager only — employees are read-only)
  DELETE         → hr only
"""

from auth import require_auth, ALL_ROLES, CAN_WRITE, CAN_DELETE
from db import get_conn
from response import (
    error, no_content, not_found, ok,
    parse_body, get_path_param, get_query_param, server_error
)

PLAN_COLS = ["id", "employee_id", "title", "description",
             "start_date", "end_date", "status", "created_at", "updated_at"]
GOAL_COLS = ["id", "plan_id", "title", "description",
             "progress", "due_date", "status", "created_at", "updated_at"]


def _plan(row):
    return {PLAN_COLS[i]: row[i] for i in range(len(PLAN_COLS))}


def _goal(row):
    return {GOAL_COLS[i]: row[i] for i in range(len(GOAL_COLS))}


# ── Plans ──────────────────────────────────────────────────────────────────

def list_plans(event):
    require_auth(event, ALL_ROLES)
    emp_id = get_query_param(event, "employee_id")
    conn = get_conn()
    with conn.cursor() as cur:
        if emp_id:
            cur.execute(
                f"SELECT {','.join(PLAN_COLS)} FROM development_plans "
                f"WHERE employee_id = %s ORDER BY created_at DESC",
                (emp_id,),
            )
        else:
            cur.execute(
                f"SELECT {','.join(PLAN_COLS)} FROM development_plans ORDER BY created_at DESC"
            )
        rows = cur.fetchall()
    return ok([_plan(r) for r in rows])


def get_plan(event):
    require_auth(event, ALL_ROLES)
    pid = get_path_param(event, "id")
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT {','.join(PLAN_COLS)} FROM development_plans WHERE id = %s", (pid,)
        )
        row = cur.fetchone()
    if not row:
        return not_found("Development plan")
    plan = _plan(row)
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT {','.join(GOAL_COLS)} FROM goals WHERE plan_id = %s ORDER BY created_at",
            (pid,),
        )
        plan["goals"] = [_goal(r) for r in cur.fetchall()]
    return ok(plan)


def create_plan(event):
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
                """INSERT INTO development_plans
                   (employee_id, title, description, start_date, end_date, status)
                   VALUES (%s,%s,%s,%s,%s,%s) RETURNING id""",
                (emp_id, title, body.get("description"),
                 body.get("start_date"), body.get("end_date"),
                 body.get("status", "active")),
            )
            pid = str(cur.fetchone()[0])
        conn.commit()
    except Exception as e:
        conn.rollback()
        return server_error(e)

    return get_plan({**event, "pathParameters": {"id": pid}})


def update_plan(event):
    require_auth(event, CAN_WRITE)
    pid    = get_path_param(event, "id")
    body   = parse_body(event)
    fields = {k: v for k, v in body.items()
              if k in ("title", "description", "start_date", "end_date", "status")}
    if not fields:
        return error("No updatable fields provided")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            set_clause = ", ".join(f"{k} = %s" for k in fields)
            cur.execute(
                f"UPDATE development_plans SET {set_clause}, updated_at = NOW() WHERE id = %s",
                list(fields.values()) + [pid],
            )
            if cur.rowcount == 0:
                return not_found("Development plan")
        conn.commit()
    except Exception as e:
        conn.rollback()
        return server_error(e)

    return get_plan(event)


def delete_plan(event):
    require_auth(event, CAN_DELETE)
    pid = get_path_param(event, "id")
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("DELETE FROM development_plans WHERE id = %s", (pid,))
        if cur.rowcount == 0:
            conn.rollback()
            return not_found("Development plan")
    conn.commit()
    return no_content()


# ── Goals ──────────────────────────────────────────────────────────────────

def create_goal(event):
    require_auth(event, CAN_WRITE)
    body    = parse_body(event)
    plan_id = body.get("plan_id")
    title   = (body.get("title") or "").strip()
    if not plan_id or not title:
        return error("plan_id and title are required")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO goals (plan_id, title, description, progress, due_date, status)
                   VALUES (%s,%s,%s,%s,%s,%s) RETURNING id""",
                (plan_id, title, body.get("description"),
                 body.get("progress", 0), body.get("due_date"),
                 body.get("status", "pending")),
            )
            gid = str(cur.fetchone()[0])
        conn.commit()
    except Exception as e:
        conn.rollback()
        return server_error(e)

    with conn.cursor() as cur:
        cur.execute(f"SELECT {','.join(GOAL_COLS)} FROM goals WHERE id = %s", (gid,))
        return ok(_goal(cur.fetchone()))


def update_goal(event):
    require_auth(event, CAN_WRITE)          # employees are read-only; only hr/manager may update
    gid    = get_path_param(event, "id")
    body   = parse_body(event)
    fields = {k: v for k, v in body.items()
              if k in ("title", "description", "progress", "due_date", "status")}
    if not fields:
        return error("No updatable fields provided")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            set_clause = ", ".join(f"{k} = %s" for k in fields)
            cur.execute(
                f"UPDATE goals SET {set_clause}, updated_at = NOW() WHERE id = %s",
                list(fields.values()) + [gid],
            )
            if cur.rowcount == 0:
                return not_found("Goal")
            cur.execute(f"SELECT {','.join(GOAL_COLS)} FROM goals WHERE id = %s", (gid,))
            return ok(_goal(cur.fetchone()))
    except Exception as e:
        conn.rollback()
        return server_error(e)
    finally:
        conn.commit()
