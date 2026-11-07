#!/usr/bin/env python3
"""Minimal GitHub push webhook for STKCraft.

Receives a signed push event on 127.0.0.1:8788, validates X-Hub-Signature-256,
and starts deploy.sh for pushes to main. Caddy exposes it at /webhook.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = "127.0.0.1"
PORT = int(os.environ.get("WEBHOOK_PORT", "8788"))
SECRET_FILE = os.environ.get("WEBHOOK_SECRET_FILE", "/etc/stkscraft/webhook.secret")
DEPLOY = os.environ.get("DEPLOY_SCRIPT", "/opt/stkscraft/deploy/deploy.sh")
MAX_BODY = 1_000_000
_lock = threading.Lock()


def read_secret() -> bytes:
    with open(SECRET_FILE, "rb") as handle:
        return handle.read().strip()


class Handler(BaseHTTPRequestHandler):
    server_version = "STKCraftWebhook/1.0"

    def _send(self, status: int, body: dict[str, str] | str) -> None:
        if isinstance(body, dict):
            payload = json.dumps(body).encode()
            content_type = "application/json"
        else:
            payload = body.encode()
            content_type = "text/plain; charset=utf-8"
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._send(200, {"ok": True})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path.split("?", 1)[0] != "/webhook":
            self._send(404, {"error": "not found"})
            return

        length = int(self.headers.get("Content-Length", "0"))
        if length < 1 or length > MAX_BODY:
            self._send(413, {"error": "body too large"})
            return

        body = self.rfile.read(length)
        signature = self.headers.get("X-Hub-Signature-256", "")
        try:
            secret = read_secret()
        except OSError as error:
            self._send(500, {"error": f"secret unavailable: {error}"})
            return
        expected = "sha256=" + hmac.new(secret, body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            self._send(401, {"error": "bad signature"})
            return

        event = self.headers.get("X-GitHub-Event", "")
        if event == "ping":
            self._send(200, {"ok": True, "message": "pong"})
            return

        if event != "push":
            self._send(204, {"ok": True, "message": "ignored event"})
            return

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self._send(400, {"error": "invalid json"})
            return

        if payload.get("ref") != "refs/heads/main":
            self._send(204, {"ok": True, "message": "ignored ref"})
            return

        if not _lock.acquire(blocking=False):
            self._send(409, {"error": "deploy already queued"})
            return
        try:
            subprocess.Popen(
                ["/bin/bash", DEPLOY],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                close_fds=True,
            )
        except OSError as error:
            _lock.release()
            print(f"cannot start deploy: {error}", file=sys.stderr, flush=True)
            self._send(500, {"error": f"cannot start deploy: {error}"})
            return

        # Release after a short grace period; deploy.sh has its own flock.
        threading.Timer(5.0, _lock.release).start()
        self._send(202, {"ok": True, "message": "deploy queued"})

    def log_message(self, fmt: str, *args: object) -> None:
        print("%s - %s" % (self.address_string(), fmt % args), file=sys.stderr, flush=True)


if __name__ == "__main__":
    if not os.path.exists(SECRET_FILE):
        print(f"missing webhook secret: {SECRET_FILE}", file=sys.stderr)
        sys.exit(1)
    print(f"STKCraft webhook listening on {HOST}:{PORT}", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
