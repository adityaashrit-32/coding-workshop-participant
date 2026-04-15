"""
Local development server — wraps Lambda handler with Flask.

Architecture:
  React (port 3000)
    → Vite proxy /api/* → Flask (port 8000)
      → handler(event)  [function.py]
        → ROUTES regex dispatch
          → routes_*.py functions
            → db.py (PostgreSQL)
"""

import logging

from flask import Flask, request, Response, jsonify
from flask_cors import CORS

from function import handler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://localhost:5173"]}})


@app.route("/health", methods=["GET"])
@app.route("/test",   methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "epdm-service"}), 200


@app.route("/favicon.ico", methods=["GET"])
def favicon():
    return Response(status=204)


@app.route("/", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
@app.route("/<path:path>",            methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
def proxy(path):
    full_path = "/" + path
    logger.info("%s %s", request.method, full_path)

    event = {
        "rawPath": full_path,
        "httpMethod": request.method,
        "requestContext": {"http": {"method": request.method, "path": full_path}},
        "headers": dict(request.headers),
        "queryStringParameters": request.args.to_dict() or None,
        "body": request.get_data(as_text=True) or None,
    }

    result = handler(event) or {}

    # Strip hop-by-hop headers Flask recomputes automatically
    skip = {"content-length", "transfer-encoding", "connection"}
    headers = {k: v for k, v in result.get("headers", {}).items()
               if k.lower() not in skip}

    return Response(
        result.get("body", ""),
        status=result.get("statusCode", 200),
        headers=headers,
    )


if __name__ == "__main__":
    print("Backend running at http://localhost:8000")
    app.run(host="0.0.0.0", port=8000, debug=True)
