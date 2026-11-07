#!/usr/bin/env bash
# Print the private visitor CSV as a readable table. Root-only by design.
set -euo pipefail
CSV="${VISITOR_CSV:-/var/lib/stkscraft/visitors.csv}"
if [[ ! -s "$CSV" ]]; then
  echo "No visitors recorded yet."
  exit 0
fi
python3 - "$CSV" <<'PY'
import csv, sys
path = sys.argv[1]
with open(path, newline="", encoding="utf-8") as handle:
    rows = list(csv.DictReader(handle))
print(f"{len(rows)} unique IPs\n")
print(f"{'IP':39} {'FIRST SEEN':20} {'LAST SEEN':20} {'HITS':>5}  {'COUNTRY':18} {'CITY':20}  LAST PATH")
print("-" * 150)
for row in rows:
    print(
        f"{row['ip'][:39]:39} {row['first_seen_utc'][:20]:20} {row['last_seen_utc'][:20]:20} "
        f"{row['hits']:>5}  {(row['country'] or '-'):18} {(row['city'] or '-'):20}  {row['last_path'][:40]}"
    )
PY
