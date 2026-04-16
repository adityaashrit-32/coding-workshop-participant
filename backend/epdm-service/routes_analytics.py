"""
Analytics routes — read-only aggregation endpoints.

GET /analytics/employees-by-role
GET /analytics/performance-distribution
GET /analytics/training-completion
GET /analytics/monthly-performance-trend

All endpoints:
  - Require authentication (any role)
  - Execute SELECT queries only — no data is modified
  - Return JSON-formatted aggregated data
"""

from auth import require_auth, ALL_ROLES
from db import get_conn
from response import ok, server_error


def employees_by_role(event):
    """
    Count of active employees grouped by job_title.

    Returns each distinct job_title and the number of active employees
    holding that title, ordered by count descending.
    Employees with no job_title are grouped under 'Unassigned'.
    """
    require_auth(event, ALL_ROLES)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    COALESCE(NULLIF(TRIM(job_title), ''), 'Unassigned') AS role,
                    COUNT(*)::int                                        AS count
                FROM employees
                WHERE status = 'active'
                GROUP BY COALESCE(NULLIF(TRIM(job_title), ''), 'Unassigned')
                ORDER BY count DESC, role
            """)
            rows = cur.fetchall()

        return ok({
            "total": sum(r[1] for r in rows),
            "breakdown": [{"role": r[0], "count": r[1]} for r in rows],
        })
    except Exception as e:
        return server_error(e)


def performance_distribution(event):
    """
    Count of approved performance reviews grouped by rating band.

    Bands:
      Exceptional  — rating 4.5 – 5.0
      Strong       — rating 3.5 – 4.4
      Meets        — rating 2.5 – 3.4
      Below        — rating 1.5 – 2.4
      Poor         — rating 1.0 – 1.4

    Also returns the overall average rating across all approved reviews
    that have a non-null rating.
    """
    require_auth(event, ALL_ROLES)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # Band counts
            cur.execute("""
                SELECT
                    CASE
                        WHEN rating >= 4.5 THEN 'Exceptional'
                        WHEN rating >= 3.5 THEN 'Strong'
                        WHEN rating >= 2.5 THEN 'Average'
                        WHEN rating >= 1.5 THEN 'Below'
                        ELSE                    'Poor'
                    END                  AS band,
                    COUNT(*)::int        AS count,
                    ROUND(MIN(rating)::numeric, 1) AS min_rating,
                    ROUND(MAX(rating)::numeric, 1) AS max_rating
                FROM performance_reviews
                WHERE status = 'approved'
                  AND rating IS NOT NULL
                GROUP BY band
                ORDER BY MIN(rating) DESC
            """)
            band_rows = cur.fetchall()

            # Overall average
            cur.execute("""
                SELECT
                    ROUND(AVG(rating)::numeric, 2) AS avg_rating,
                    COUNT(*)::int                  AS total_reviews
                FROM performance_reviews
                WHERE status = 'approved'
                  AND rating IS NOT NULL
            """)
            summary_row = cur.fetchone()

        return ok({
            "avg_rating": float(summary_row[0]) if summary_row[0] else None,
            "total_reviews": summary_row[1],
            "distribution": [
                {
                    "band": r[0],
                    "count": r[1],
                    "min_rating": float(r[2]),
                    "max_rating": float(r[3]),
                }
                for r in band_rows
            ],
        })
    except Exception as e:
        return server_error(e)


def training_completion(event):
    """
    Training record counts split by completion status.

    A record is 'completed' when completed_date IS NOT NULL and
    completed_date <= today.  All other records are 'pending'.

    Also returns total duration hours for completed records and a
    per-department breakdown of completion counts.
    """
    require_auth(event, ALL_ROLES)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # Overall completed vs pending
            cur.execute("""
                SELECT
                    CASE
                        WHEN completed_date IS NOT NULL
                         AND completed_date <= CURRENT_DATE THEN 'completed'
                        ELSE 'pending'
                    END                          AS completion_status,
                    COUNT(*)::int                AS count,
                    ROUND(SUM(COALESCE(duration_hours, 0))::numeric, 1) AS total_hours
                FROM training_records
                GROUP BY completion_status
                ORDER BY completion_status
            """)
            status_rows = cur.fetchall()

            # Per-department breakdown (completed only)
            cur.execute("""
                SELECT
                    COALESCE(NULLIF(TRIM(e.department), ''), 'Unassigned') AS department,
                    COUNT(*)::int                                           AS completed,
                    ROUND(SUM(COALESCE(t.duration_hours, 0))::numeric, 1)  AS total_hours
                FROM training_records t
                JOIN employees e ON e.id = t.employee_id
                WHERE t.completed_date IS NOT NULL
                  AND t.completed_date <= CURRENT_DATE
                GROUP BY COALESCE(NULLIF(TRIM(e.department), ''), 'Unassigned')
                ORDER BY completed DESC, department
            """)
            dept_rows = cur.fetchall()

        # Build summary dict from status rows
        summary = {"completed": {"count": 0, "total_hours": 0.0},
                   "pending":   {"count": 0, "total_hours": 0.0}}
        for r in status_rows:
            summary[r[0]] = {"count": r[1], "total_hours": float(r[2])}

        total = summary["completed"]["count"] + summary["pending"]["count"]
        pct = round(summary["completed"]["count"] / total * 100, 1) if total else 0.0

        return ok({
            "total_records": total,
            "completion_rate_pct": pct,
            "completed": summary["completed"],
            "pending": summary["pending"],
            "by_department": [
                {"department": r[0], "completed": r[1], "total_hours": float(r[2])}
                for r in dept_rows
            ],
        })
    except Exception as e:
        return server_error(e)


def monthly_performance_trend(event):
    """
    Number of performance reviews submitted per calendar month,
    for the last 12 months, ordered oldest → newest.

    Returns both the raw monthly counts and a rolling 3-month
    average rating for approved reviews that have a rating.
    """
    require_auth(event, ALL_ROLES)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # Monthly review counts (all statuses) for the last 12 months
            cur.execute("""
                SELECT
                    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
                    COUNT(*)::int                                        AS total_reviews,
                    COUNT(*) FILTER (WHERE status = 'approved')::int    AS approved,
                    COUNT(*) FILTER (WHERE status = 'submitted')::int   AS submitted,
                    COUNT(*) FILTER (WHERE status = 'draft')::int       AS draft,
                    ROUND(
                        AVG(rating) FILTER (WHERE status = 'approved' AND rating IS NOT NULL)::numeric,
                        2
                    )                                                    AS avg_rating
                FROM performance_reviews
                WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY DATE_TRUNC('month', created_at)
            """)
            rows = cur.fetchall()

        months = [
            {
                "month": r[0],
                "total_reviews": r[1],
                "approved": r[2],
                "submitted": r[3],
                "draft": r[4],
                "avg_rating": float(r[5]) if r[5] is not None else None,
            }
            for r in rows
        ]

        # Rolling 3-month average rating (computed in Python to avoid window fn complexity)
        for i, m in enumerate(months):
            window = [
                months[j]["avg_rating"]
                for j in range(max(0, i - 2), i + 1)
                if months[j]["avg_rating"] is not None
            ]
            m["rolling_3m_avg"] = round(sum(window) / len(window), 2) if window else None

        return ok({
            "months_returned": len(months),
            "trend": months,
        })
    except Exception as e:
        return server_error(e)
