#!/usr/bin/env python3
"""Collect unique visitors from the private Caddy access log.

Output: /var/lib/stkscraft/visitors.csv (0600, outside the web root).
One row per unique client IP, with first/last seen, request count, coarse
geography (DB-IP Lite), last path, referer and user agent.

The collector is deliberately not exposed over HTTP. It is run by a systemd
timer every five minutes.
"""
from __future__ import annotations

import csv
import fcntl
import ipaddress
import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

LOG_PATH = Path(os.environ.get("VISITOR_LOG", "/var/log/caddy/stkscraft-access.log"))
STATE_PATH = Path(os.environ.get("VISITOR_STATE", "/var/lib/stkscraft/visitor-state.json"))
CSV_PATH = Path(os.environ.get("VISITOR_CSV", "/var/lib/stkscraft/visitors.csv"))
GEOIP_PATH = Path(os.environ.get("VISITOR_GEOIP", "/var/lib/stkscraft/geoip/dbip-city.mmdb"))
LOCK_PATH = Path("/var/lib/stkscraft/visitor-log.lock")

FIELDS = [
    "ip",
    "first_seen_utc",
    "last_seen_utc",
    "hits",
    "country_code",
    "country",
    "region",
    "city",
    "last_path",
    "last_referer",
    "last_user_agent",
]
SKIP_PATHS = ("/health", "/webhook", "/api/visitors")
IGNORED_IPS = {
    "127.0.0.1",
    "::1",
    "176.122.160.172",
    "2607:8700:5501:67ab::2",
}


def utc(ts: float) -> str:
    return datetime.fromtimestamp(ts, timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def first_header(headers: dict, name: str) -> str:
    value = headers.get(name) or headers.get(name.lower()) or ""
    if isinstance(value, list):
        value = value[0] if value else ""
    return str(value)[:500]


def geo(reader, ip: str) -> tuple[str, str, str, str]:
    if reader is None:
        return "", "", "", ""
    try:
        row = reader.get(ip) or {}
    except Exception:
        return "", "", "", ""
    country = row.get("country") or {}
    city = row.get("city") or {}
    subdivisions = row.get("subdivisions") or []
    region = ""
    if subdivisions:
        region = (subdivisions[0].get("names") or {}).get("en", "")
    return (
        country.get("iso_code", ""),
        (country.get("names") or {}).get("en", ""),
        region,
        (city.get("names") or {}).get("en", ""),
    )


def load_rows() -> dict[str, dict[str, str]]:
    rows: dict[str, dict[str, str]] = {}
    if not CSV_PATH.exists():
        return rows
    with CSV_PATH.open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            ip = (row.get("ip") or "").strip()
            if ip:
                rows[ip] = {field: row.get(field, "") for field in FIELDS}
    return rows


def write_rows(rows: dict[str, dict[str, str]]) -> None:
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    os.chmod(CSV_PATH.parent, 0o700)
    fd, temp_name = tempfile.mkstemp(prefix=".visitors-", suffix=".csv", dir=CSV_PATH.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=FIELDS)
            writer.writeheader()
            for ip in sorted(rows):
                writer.writerow(rows[ip])
        os.chmod(temp_name, 0o600)
        os.replace(temp_name, CSV_PATH)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def main() -> int:
    if not LOG_PATH.exists():
        print(f"access log not present yet: {LOG_PATH}")
        return 0
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    os.chmod(CSV_PATH.parent, 0o700)
    lock = LOCK_PATH.open("a+")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        print("another collector is running")
        return 0

    state = {}
    if STATE_PATH.exists():
        try:
            state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            state = {}

    reader = None
    try:
        import maxminddb  # type: ignore

        if GEOIP_PATH.exists():
            reader = maxminddb.open_database(str(GEOIP_PATH))
    except Exception as error:
        print(f"geoip unavailable: {error}")

    rows = load_rows()
    stat = LOG_PATH.stat()
    offset = int(state.get("offset", 0))
    if state.get("inode") != stat.st_ino or offset > stat.st_size:
        offset = 0

    with LOG_PATH.open("rb") as handle:
        handle.seek(offset)
        data = handle.read()
    end = data.rfind(b"\n")
    if end < 0:
        new_offset = offset
        data = b""
    else:
        data = data[: end + 1]
        new_offset = offset + len(data)

    added = 0
    updated = 0
    for raw in data.splitlines():
        if not raw.strip():
            continue
        try:
            # Decode explicitly: json.loads(bytes) auto-detects UTF-16/32 and can
            # mistake NUL padding from a log truncation for a different codec.
            entry = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            continue
        request = entry.get("request") or {}
        uri = request.get("uri") or ""
        if uri.startswith(SKIP_PATHS):
            continue
        ip = str(request.get("remote_ip") or "").strip()
        try:
            address = ipaddress.ip_address(ip)
        except ValueError:
            continue
        if (
            ip in IGNORED_IPS
            or address.is_private
            or address.is_loopback
            or address.is_link_local
            or address.is_multicast
            or address.is_reserved
            or address.is_unspecified
        ):
            continue
        seen = utc(float(entry.get("ts") or 0))
        path = urlsplit(uri).path[:300] or "/"
        referer = first_header(request.get("headers") or {}, "Referer")
        agent = first_header(request.get("headers") or {}, "User-Agent")
        row = rows.get(ip)
        if row is None:
            code, country, region, city = geo(reader, ip)
            row = {
                "ip": ip,
                "first_seen_utc": seen,
                "last_seen_utc": seen,
                "hits": "1",
                "country_code": code,
                "country": country,
                "region": region,
                "city": city,
                "last_path": path,
                "last_referer": referer,
                "last_user_agent": agent,
            }
            rows[ip] = row
            added += 1
        else:
            row["last_seen_utc"] = seen
            row["hits"] = str(int(row.get("hits") or 0) + 1)
            row["last_path"] = path
            row["last_referer"] = referer
            row["last_user_agent"] = agent
            updated += 1

    write_rows(rows)
    STATE_PATH.write_text(json.dumps({"inode": stat.st_ino, "offset": new_offset}), encoding="utf-8")
    os.chmod(STATE_PATH, 0o600)
    if reader is not None:
        reader.close()
    print(f"visitors: {len(rows)} unique, {added} new, {updated} updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
