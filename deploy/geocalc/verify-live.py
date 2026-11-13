"""Exercise the deployed workspace, request budgets and existing main site."""
import concurrent.futures
import json
import sys
import time
import urllib.error
import urllib.request

base = sys.argv[1] if len(sys.argv) > 1 else "https://geocalc.stkcraft.com"

def request(path, body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, headers={"Content-Type": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=140) as response:
            return response.status, response.read().decode()
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode()

assert request("/")[0] == 200
assert request("/api-info")[0] == 200
status, text = request("/api/catalog")
assert status == 200, text
catalog = json.loads(text)
assert len(catalog["tools"]) == 24 and len(catalog["timeTools"]) == 20
status, text = request("/api/time", {"direction": "utc_to_et", "utc": {"year": 2024, "month": 1, "day": 1, "hour": 0, "minute": 0, "second": 0}})
assert status == 200 and json.loads(text)["et"] == 757339269.1839061, text
status, text = request("/api/calculate", {"operation": "state_vector", "parameters": {"target": 301, "observer": 399, "epoch_et": 0, "correction": "NONE"}})
assert status == 200, text
status, text = request("/api/time", {"direction": "utc_to_et", "utc": {"year": 2024, "month": 2, "day": 30, "hour": 0, "minute": 0, "second": 0}})
assert status == 400 and json.loads(text).get("error"), (status, text)
status, text = request("/api/time/convert", {"operation": "utc_to_et", "parameters": {"lsk_path": "/etc/passwd"}})
assert status == 400, (status, text)
time.sleep(3)
# Spoofed public headers must not bypass the actual peer's request budget.
with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
    replies = list(pool.map(lambda i: request("/api/catalog", headers={"X-Geocalc-Client-IP": f"198.51.100.{i + 1}"}), range(24)))
statuses = [status for status, _ in replies]
assert 429 in statuses and set(statuses) <= {200, 429}, statuses
assert all(json.loads(body).get("error") for status, body in replies if status == 429), "Rate errors must be JSON"
assert request("/")[0] == 200, "Static UI must remain available during throttling"
for path in ("/", "/zh/"):
    with urllib.request.urlopen("https://www.stkcraft.com" + path, timeout=20) as response:
        assert response.status == 200
print(json.dumps({"workspace": "ok", "catalog": [24, 20], "time_and_geometry": "ok", "invalid_requests": "rejected", "rate_statuses": {str(code): statuses.count(code) for code in set(statuses)}, "main_site": "ok"}, indent=2))
