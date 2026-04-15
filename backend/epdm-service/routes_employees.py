"""
Employee routes: CRUD on /employees
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

COLS = ["id", "user_id", "first_name", "last_name", "email", "department",
        "job_title", "manager_id", "hire_date", "status", "created_at", "updated_at"]


def _row(row):
    return {COLS[i]: row[i] for i in range(len(COLS))}


def list_employees(event):
    require_auth(event, ALL_ROLES)
    dept = get_query_param(event, "department")
    status = get_query_param(event, "status", "active")
    conn = get_conn()
    with conn.cursor() as cur:
        sql = f"SELECT {','.join(COLS)} FROM employees WHERE status = %s"
        params = [status]
        if dept:
            sql += " AND department = %s"
            params.append(dept)
        sql += " ORDER BY last_name, first_name"
        cur.execute(sql, params)
        rows = cur.fetchall()
    return ok([_row(r) for r in rows])


def get_employee(event):
    require_auth(event, ALL_ROLES)
    emp_id = get_path_param(event, "id")
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(f"SELECT {','.join(COLS)} FROM employees WHERE id = %s", (emp_id,))
        row = cur.fetchone()
    return ok(_row(row)) if row else not_found("Employee")


def create_employee(event):
    require_auth(event, CAN_WRITE)
    body = parse_body(event)
    first_name = (body.get("first_name") or "").strip()
    last_name  = (body.get("last_name")  or "").strip()
    email      = (body.get("email")      or "").strip().lower()
    if not first_name or not last_name or not email:
        return error("first_name, last_name, and email are required")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO employees
                   (first_name, last_name, email, department, job_title, manager_id, hire_date, status)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                (first_name, last_name, email,
                 body.get("department"), body.get("job_title"),
                 body.get("manager_id"), body.get("hire_date"),
                 body.get("status", "active")),
            )
            emp_id = str(cur.fetchone()[0])
        conn.commit()
    except Exception as e:
        conn.rollback()
        return server_error(e)

    return get_employee({**event, "pathParameters": {"id": emp_id}})


def update_employee(event):
    require_auth(event, CAN_WRITE)
    emp_id = get_path_param(event, "id")
    body   = parse_body(event)
    fields = {k: v for k, v in body.items()
              if k in ("first_name", "last_name", "email", "department",
                       "job_title", "manager_id", "hire_date", "status")}
    if not fields:
        return error("No updatable fields provided")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            set_clause = ", ".join(f"{k} = %s" for k in fields)
            cur.execute(
                f"UPDATE employees SET {set_clause}, updated_at = NOW() WHERE id = %s",
                list(fields.values()) + [emp_id],
            )
            if cur.rowcount == 0:
                return not_found("Employee")
        conn.commit()
    except Exception as e:
        conn.rollback()
        return server_error(e)

    return get_employee(event)


def delete_employee(event):
    require_auth(event, CAN_DELETE)          # hr only — managers cannot delete
    emp_id = get_path_param(event, "id")
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("DELETE FROM employees WHERE id = %s", (emp_id,))
        if cur.rowcount == 0:
            conn.rollback()
            return not_found("Employee")
    conn.commit()
    return no_content()
