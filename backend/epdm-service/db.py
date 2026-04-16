"""
Database connection management for EPDM service.
Uses pg8000 — pure Python PostgreSQL driver, no system library dependencies.
"""

import logging
import os
import pg8000.native

logger = logging.getLogger(__name__)

_is_local = os.getenv("IS_LOCAL", "true") == "true"

_pg_host = os.getenv("POSTGRES_HOST", "localhost")
if not _pg_host or _pg_host in (":", ":1", "0", ""):
    _pg_host = "localhost"

_pg_port     = int(os.getenv("POSTGRES_PORT", "5432"))
_pg_user     = os.getenv("POSTGRES_USER", "postgres")
_pg_password = os.getenv("POSTGRES_PASS", "postgres123")
_pg_dbname   = os.getenv("POSTGRES_NAME", "postgres")

_conn = None

SCHEMA_SQL = """
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('hr','manager','employee')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    department  TEXT,
    job_title   TEXT,
    manager_id  UUID REFERENCES employees(id) ON DELETE SET NULL,
    hire_date   DATE,
    status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reviewer_id     UUID REFERENCES employees(id) ON DELETE SET NULL,
    period          TEXT NOT NULL,
    rating          NUMERIC(3,1) CHECK (rating BETWEEN 1 AND 5),
    comments        TEXT,
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS development_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    start_date      DATE,
    end_date        DATE,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id         UUID NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    progress        INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    due_date        DATE,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competencies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT UNIQUE NOT NULL,
    description TEXT,
    category    TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_competencies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    competency_id   UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    current_level   INTEGER DEFAULT 1 CHECK (current_level BETWEEN 1 AND 5),
    target_level    INTEGER DEFAULT 3 CHECK (target_level BETWEEN 1 AND 5),
    assessed_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, competency_id)
);

CREATE TABLE IF NOT EXISTS training_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    provider        TEXT,
    completed_date  DATE,
    duration_hours  NUMERIC(5,1),
    competency_id   UUID REFERENCES competencies(id) ON DELETE SET NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
"""


class _Conn:
    """Thin wrapper around pg8000.native.Connection to mimic psycopg interface."""

    def __init__(self, conn):
        self._c = conn
        self.closed = False
        self.autocommit = False

    def cursor(self):
        return _Cursor(self._c, self)

    def commit(self):
        self._c.run("COMMIT")

    def rollback(self):
        try:
            self._c.run("ROLLBACK")
        except Exception:
            pass

    def execute(self, sql):
        self._c.run(sql)

    def close(self):
        try:
            self._c.close()
        except Exception:
            pass
        self.closed = True


class _Cursor:
    """Minimal cursor wrapper for pg8000."""

    def __init__(self, conn, wrapper):
        self._c = conn
        self._w = wrapper
        self._rows = []
        self._pos = 0

    def execute(self, sql, params=None):
        # pg8000 native uses :param_name style — convert %s to positional names
        if params:
            import re
            count = [0]
            named_params = {}
            def replacer(m):
                count[0] += 1
                key = f'p{count[0]}'
                return f':{key}'
            pg_sql = re.sub(r'%s', replacer, sql)
            for i, v in enumerate(params, 1):
                named_params[f'p{i}'] = v
            self._rows = self._c.run(pg_sql, **named_params)
        else:
            self._rows = self._c.run(sql)
        self._pos = 0
        if self._rows is None:
            self._rows = []

    def fetchone(self):
        if self._pos < len(self._rows):
            row = self._rows[self._pos]
            self._pos += 1
            return row
        return None

    def fetchall(self):
        rows = self._rows[self._pos:]
        self._pos = len(self._rows)
        return rows

    @property
    def rowcount(self):
        return len(self._rows)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass


def _new_conn():
    ssl_context = None
    if not _is_local:
        import ssl
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

    raw = pg8000.native.Connection(
        host=_pg_host,
        port=_pg_port,
        user=_pg_user,
        password=_pg_password,
        database=_pg_dbname,
        timeout=30,
        ssl_context=ssl_context,
    )
    raw.run("BEGIN")
    return _Conn(raw)


def get_conn():
    global _conn
    for attempt in range(2):
        try:
            if _conn is None or _conn.closed:
                logger.info("Connecting to PostgreSQL at %s (attempt %d)", _pg_host, attempt + 1)
                _conn = _new_conn()
                logger.info("PostgreSQL connected")
            else:
                try:
                    _conn.execute("SELECT 1")
                except Exception:
                    logger.warning("Stale connection, reconnecting...")
                    try: _conn.close()
                    except Exception: pass
                    _conn = None
                    continue
            return _conn
        except Exception as e:
            logger.error("DB connection error (attempt %d): %s", attempt + 1, e)
            _conn = None
            if attempt == 0:
                import time
                time.sleep(2)
                continue
            raise


def init_schema():
    conn = get_conn()
    with conn.cursor() as cur:
        for stmt in SCHEMA_SQL.split(";"):
            stmt = stmt.strip()
            if stmt:
                cur.execute(stmt)
    conn.commit()
