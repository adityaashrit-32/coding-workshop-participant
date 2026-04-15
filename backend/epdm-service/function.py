"""
EPDM Service — Employee Performance & Development Management
Lambda entry point. Routes requests by HTTP method + path pattern.
"""

import json
import logging
import re

from db import init_schema
from response import error, ok

import routes_analytics
import routes_auth
import routes_competencies
import routes_dashboard
import routes_employees
import routes_plans
import routes_reviews
import routes_training

logger = logging.getLogger()
logger.setLevel(logging.INFO)

_schema_initialized = False

ROUTES = [
    # Auth
    ("POST",   r"^/auth/login$",                    routes_auth.login),
    ("POST",   r"^/auth/register$",                 routes_auth.register),
    ("GET",    r"^/auth/me$",                        routes_auth.me),
    # Employees
    ("GET",    r"^/employees$",                      routes_employees.list_employees),
    ("POST",   r"^/employees$",                      routes_employees.create_employee),
    ("GET",    r"^/employees/(?P<id>[^/]+)$",        routes_employees.get_employee),
    ("PUT",    r"^/employees/(?P<id>[^/]+)$",        routes_employees.update_employee),
    ("DELETE", r"^/employees/(?P<id>[^/]+)$",        routes_employees.delete_employee),
    # Reviews
    ("GET",    r"^/reviews$",                        routes_reviews.list_reviews),
    ("POST",   r"^/reviews$",                        routes_reviews.create_review),
    ("GET",    r"^/reviews/(?P<id>[^/]+)$",          routes_reviews.get_review),
    ("PUT",    r"^/reviews/(?P<id>[^/]+)$",          routes_reviews.update_review),
    ("DELETE", r"^/reviews/(?P<id>[^/]+)$",          routes_reviews.delete_review),
    # Development plans
    ("GET",    r"^/plans$",                          routes_plans.list_plans),
    ("POST",   r"^/plans$",                          routes_plans.create_plan),
    ("GET",    r"^/plans/(?P<id>[^/]+)$",            routes_plans.get_plan),
    ("PUT",    r"^/plans/(?P<id>[^/]+)$",            routes_plans.update_plan),
    ("DELETE", r"^/plans/(?P<id>[^/]+)$",            routes_plans.delete_plan),
    # Goals
    ("POST",   r"^/goals$",                          routes_plans.create_goal),
    ("PUT",    r"^/goals/(?P<id>[^/]+)$",            routes_plans.update_goal),
    # Competencies
    ("GET",    r"^/competencies$",                   routes_competencies.list_competencies),
    ("POST",   r"^/competencies$",                   routes_competencies.create_competency),
    ("GET",    r"^/competencies/(?P<id>[^/]+)$",     routes_competencies.get_competency),
    ("PUT",    r"^/competencies/(?P<id>[^/]+)$",     routes_competencies.update_competency),
    ("DELETE", r"^/competencies/(?P<id>[^/]+)$",     routes_competencies.delete_competency),
    # Employee competencies
    ("GET",    r"^/employee-competencies$",          routes_competencies.list_employee_competencies),
    ("POST",   r"^/employee-competencies$",          routes_competencies.assign_competency),
    # Training
    ("GET",    r"^/training$",                       routes_training.list_training),
    ("POST",   r"^/training$",                       routes_training.create_training),
    ("GET",    r"^/training/(?P<id>[^/]+)$",         routes_training.get_training),
    ("DELETE", r"^/training/(?P<id>[^/]+)$",         routes_training.delete_training),
    # Dashboard
    ("GET",    r"^/dashboard$",                      routes_dashboard.dashboard),
    # Analytics
    ("GET",    r"^/analytics/employees-by-role$",         routes_analytics.employees_by_role),
    ("GET",    r"^/analytics/performance-distribution$",  routes_analytics.performance_distribution),
    ("GET",    r"^/analytics/training-completion$",       routes_analytics.training_completion),
    ("GET",    r"^/analytics/monthly-performance-trend$", routes_analytics.monthly_performance_trend),
]

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
}


def handler(event=None, context=None):
    global _schema_initialized

    logger.info("Event: %s", json.dumps(event or {}))

    # Handle CORS preflight
    method = (event or {}).get("requestContext", {}).get("http", {}).get("method") or \
              (event or {}).get("httpMethod") or \
              (event or {}).get("requestContext", {}).get("httpMethod") or "GET"

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    # Lazy schema init (once per container)
    if not _schema_initialized:
        try:
            init_schema()
            _schema_initialized = True
        except Exception as e:
            logger.error("Schema init failed: %s", e)
            return error(f"Database initialization failed: {e}", 500)

    # Resolve path — support both Lambda Function URL and API Gateway formats
    raw_path = (
        (event or {}).get("rawPath") or
        (event or {}).get("path") or
        (event or {}).get("requestContext", {}).get("http", {}).get("path") or
        "/"
    )

    # Strip /api/<service-name> prefix added by CloudFront
    path = re.sub(r"^/api/[^/]+", "", raw_path) or "/"

    logger.info("Routing %s %s", method, path)

    for route_method, pattern, fn in ROUTES:
        if route_method != method:
            continue
        m = re.match(pattern, path)
        if m:
            enriched = dict(event or {})
            if m.groupdict():
                enriched["pathParameters"] = {**enriched.get("pathParameters", {}), **m.groupdict()}
            try:
                return fn(enriched)
            except PermissionError as e:
                return error(str(e), 403)
            except Exception as e:
                logger.exception("Unhandled error in %s", fn.__name__)
                return error(f"Internal error: {e}", 500)

    return error(f"Route not found: {method} {path}", 404)


if __name__ == "__main__":
    # Quick local smoke test
    print(handler({"rawPath": "/auth/register", "httpMethod": "POST",
                   "body": '{"email":"admin@test.com","password":"admin123","role":"admin"}'}))
