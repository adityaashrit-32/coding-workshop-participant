"""
Competency + employee_competency routes.
Permissions:
  GET            → all authenticated roles
  POST, PUT      → hr, manager  (competency library create/update: hr only)
  DELETE         → hr only
"""

from auth import require_auth, ALL_ROLES, CAN_WRITE, CAN_DELETE, HR
from db import get_conn
from response import (
    error, no_content, not_found, ok,
    parse_body, get_path_param, get_query_param, server_error
)

COMP_COLS = ["id", "name", "description", "category", "created_at"]
EC_COLS   = ["id", "employee_id", "competency_id", "current_level", "target_level", "assessed_at"]


def _comp(row):
    return {COMP_COLS[i]: row[i] for i in range(len(COMP_COLS))}


def _ec(row):
    return {EC_COLS[i]: row[i] for i in range(len(EC_COLS))}


# ── Competency library ─────────────────────────────────────────────────────

def list_competencies(event):
    require_auth(event, ALL_ROLES)
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT {','.join(COMP_COLS)} FROM competencies ORDER BY category, name"
        )
        return ok([_comp(r) for r in cur.fetchall()])


def get_competency(event):
    require_auth(event, ALL_ROLES)
    cid = get_path_param(event, "id")
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT {','.join(COMP_COLS)} FROM competencies WHERE id = %s", (cid,)
        )
        row = cur.fetchone()
    return ok(_comp(row)) if row else not_found("Competency")


def create_competency(event):
    require_auth(event, [HR])               # only HR may define new competencies
    body = parse_body(event)
    name = (body.get("name") or "").strip()
    if not name:
        return error("name is required")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO competencies (name, description, category) VALUES (%s,%s,%s) RETURNING id",
                (name, body.get("description"), body.get("category")),
            )
            cid = str(cur.fetchone()[0])
        conn.commit()
    except Exception as e:
        conn.rollback()
        return server_error(e)

    return get_competency({**event, "pathParameters": {"id": cid}})


def update_competency(event):
    require_auth(event, [HR])               # only HR may edit the competency library
    cid    = get_path_param(event, "id")
    body   = parse_body(event)
    fields = {k: v for k, v in body.items() if k in ("name", "description", "category")}
    if not fields:
        return error("No updatable fields provided")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            set_clause = ", ".join(f"{k} = %s" for k in fields)
            cur.execute(
                f"UPDATE competencies SET {set_clause} WHERE id = %s",
                list(fields.values()) + [cid],
            )
            if cur.rowcount == 0:
                return not_found("Competency")
        conn.commit()
    except Exception as e:
        conn.rollback()
        return server_error(e)

    return get_competency(event)


def delete_competency(event):
    require_auth(event, CAN_DELETE)
    cid = get_path_param(event, "id")
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("DELETE FROM competencies WHERE id = %s", (cid,))
        if cur.rowcount == 0:
            conn.rollback()
            return not_found("Competency")
    conn.commit()
    return no_content()


# ── Employee competency assignments ───────────────────────────────────────

def list_employee_competencies(event):
    require_auth(event, ALL_ROLES)
    emp_id = get_query_param(event, "employee_id")
    conn = get_conn()
    with conn.cursor() as cur:
        if emp_id:
            cur.execute(
                f"""SELECT ec.{',ec.'.join(EC_COLS)}, c.name, c.category
                    FROM employee_competencies ec
                    JOIN competencies c ON c.id = ec.competency_id
                    WHERE ec.employee_id = %s""",
                (emp_id,),
            )
        else:
            cur.execute(
                f"""SELECT ec.{',ec.'.join(EC_COLS)}, c.name, c.category
                    FROM employee_competencies ec
                    JOIN competencies c ON c.id = ec.competency_id"""
            )
        rows = cur.fetchall()

    result = []
    for r in rows:
        d = _ec(r[:6])
        d["competency_name"]     = r[6]
        d["competency_category"] = r[7]
        d["gap"] = d["target_level"] - d["current_level"]
        result.append(d)
    return ok(result)


def assign_competency(event):
    require_auth(event, CAN_WRITE)          # hr and manager may assign competencies
    body    = parse_body(event)
    emp_id  = body.get("employee_id")
    comp_id = body.get("competency_id")
    if not emp_id or not comp_id:
        return error("employee_id and competency_id are required")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO employee_competencies
                   (employee_id, competency_id, current_level, target_level)
                   VALUES (%s,%s,%s,%s)
                   ON CONFLICT (employee_id, competency_id)
                   DO UPDATE SET current_level = EXCLUDED.current_level,
                                 target_level  = EXCLUDED.target_level,
                                 assessed_at   = NOW()
                   RETURNING id""",
                (emp_id, comp_id,
                 body.get("current_level", 1), body.get("target_level", 3)),
            )
        conn.commit()
    except Exception as e:
        conn.rollback()
        return server_error(e)

    return list_employee_competencies(
        {**event, "queryStringParameters": {"employee_id": emp_id}}
    )
