"""
Dashboard / reporting routes.
"""

from auth import require_auth, ALL_ROLES
from db import get_conn
from response import ok, server_error


def dashboard(event):
    require_auth(event, ALL_ROLES)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # High performers (avg rating >= 4)
            cur.execute("""
                SELECT e.id, e.first_name, e.last_name, e.department,
                       ROUND(AVG(r.rating)::numeric, 2) AS avg_rating
                FROM employees e
                JOIN performance_reviews r ON r.employee_id = e.id
                WHERE r.status = 'approved' AND r.rating IS NOT NULL
                GROUP BY e.id, e.first_name, e.last_name, e.department
                HAVING AVG(r.rating) >= 4
                ORDER BY avg_rating DESC
                LIMIT 10
            """)
            high_performers = [
                {"id": str(r[0]), "first_name": r[1], "last_name": r[2],
                 "department": r[3], "avg_rating": float(r[4])}
                for r in cur.fetchall()
            ]

            # Skill gap analysis (employees with gap > 1)
            cur.execute("""
                SELECT e.id, e.first_name, e.last_name, e.department,
                       c.name AS competency, ec.current_level, ec.target_level,
                       (ec.target_level - ec.current_level) AS gap
                FROM employee_competencies ec
                JOIN employees e ON e.id = ec.employee_id
                JOIN competencies c ON c.id = ec.competency_id
                WHERE (ec.target_level - ec.current_level) > 1
                ORDER BY gap DESC
                LIMIT 20
            """)
            skill_gaps = [
                {"employee_id": str(r[0]), "first_name": r[1], "last_name": r[2],
                 "department": r[3], "competency": r[4],
                 "current_level": r[5], "target_level": r[6], "gap": r[7]}
                for r in cur.fetchall()
            ]

            # At-risk employees (low rating or no review in 6 months)
            cur.execute("""
                SELECT e.id, e.first_name, e.last_name, e.department,
                       ROUND(AVG(r.rating)::numeric, 2) AS avg_rating,
                       MAX(r.created_at) AS last_review
                FROM employees e
                LEFT JOIN performance_reviews r ON r.employee_id = e.id AND r.status = 'approved'
                WHERE e.status = 'active'
                GROUP BY e.id, e.first_name, e.last_name, e.department
                HAVING AVG(r.rating) < 2.5
                    OR MAX(r.created_at) < NOW() - INTERVAL '6 months'
                    OR MAX(r.created_at) IS NULL
                ORDER BY avg_rating ASC NULLS FIRST
                LIMIT 10
            """)
            at_risk = [
                {"id": str(r[0]), "first_name": r[1], "last_name": r[2],
                 "department": r[3], "avg_rating": float(r[4]) if r[4] else None,
                 "last_review": r[5]}
                for r in cur.fetchall()
            ]

            # Performance trends (avg rating per period)
            cur.execute("""
                SELECT period, ROUND(AVG(rating)::numeric, 2) AS avg_rating, COUNT(*) AS count
                FROM performance_reviews
                WHERE status = 'approved' AND rating IS NOT NULL
                GROUP BY period
                ORDER BY period DESC
                LIMIT 12
            """)
            trends = [
                {"period": r[0], "avg_rating": float(r[1]), "count": r[2]}
                for r in cur.fetchall()
            ]

            # Summary counts
            cur.execute("SELECT COUNT(*) FROM employees WHERE status = 'active'")
            total_employees = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM performance_reviews WHERE status = 'approved'")
            total_reviews = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM development_plans WHERE status = 'active'")
            active_plans = cur.fetchone()[0]

            cur.execute("""
                SELECT COUNT(*) FROM training_records
                WHERE completed_date >= NOW() - INTERVAL '90 days'
            """)
            recent_training = cur.fetchone()[0]

        return ok({
            "summary": {
                "total_employees": total_employees,
                "total_reviews": total_reviews,
                "active_plans": active_plans,
                "recent_training": recent_training,
            },
            "high_performers": high_performers,
            "skill_gaps": skill_gaps,
            "at_risk": at_risk,
            "performance_trends": trends,
        })
    except Exception as e:
        return server_error(e)
