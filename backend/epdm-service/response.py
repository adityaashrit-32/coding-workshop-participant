"""Shared HTTP response helpers."""

import json
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID


def _serial(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Type {type(obj)} not serializable")


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
}


def ok(data, status=200):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", **CORS},
        "body": json.dumps(data, default=_serial),
    }


def created(data):
    return ok(data, 201)


def no_content():
    return {"statusCode": 204, "headers": CORS, "body": ""}


def error(message, status=400):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", **CORS},
        "body": json.dumps({"error": message}),
    }


def not_found(resource="Resource"):
    return error(f"{resource} not found", 404)


def forbidden(message="Access denied"):
    return error(message, 403)


def server_error(e):
    return error(f"Internal server error: {e}", 500)


def parse_body(event):
    body = event.get("body") or "{}"
    if isinstance(body, str):
        import json as _json
        return _json.loads(body)
    return body


def get_path_param(event, name):
    return (event.get("pathParameters") or {}).get(name)


def get_query_param(event, name, default=None):
    return (event.get("queryStringParameters") or {}).get(name, default)
