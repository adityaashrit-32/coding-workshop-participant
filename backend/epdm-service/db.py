"""
Database connection management and schema initialization for EPDM service.
Uses psycopg (v3) with module-level connection pooling for Lambda warm reuse.
"""

import logging
import os

from psycopg import connect

logger = logging.getLogger(__name__)

_is_local = os.getenv("IS_LOCAL", "true") == "true"

PG_CONFIG = (
    f"host={os.getenv('POSTGRES_HOST', 'localhost')} "
    f"port={os.getenv('POSTGRES_PORT', '5432')} "
    f"user={os.getenv('POSTGRES_USER', 'postgres')} "
    f"password={os.getenv('POSTGRES_PASS', 'postgres123')} "
    f"dbname={os.getenv('POSTGRES_NAME', 'postgres')} "
    f"connect_timeout=15"
    + ("" if _is_local else " sslmode=require")
)

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


def get_conn():
    global _conn
    try:
        if _conn is None or _conn.closed:
            _conn = connect(PG_CONFIG)
            _conn.autocommit = False
        return _conn
    except Exception as e:
        logger.error("DB connection error: %s", e)
        _conn = None
        raise


def init_schema():
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(SCHEMA_SQL)
    conn.commit()
