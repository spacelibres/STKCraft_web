"""Fetch only the web workspace's eight upstream-pinned default kernels."""
import importlib.util
import json
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()
spec = importlib.util.spec_from_file_location("bootstrap", root / "tools/bootstrap_reference.py")
bootstrap = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bootstrap)
manifest = json.loads((root / "docs/reference/CSPICE_N0067.json").read_text())
required = {
    "de442.bsp", "pck00011.tpc", "mars_iau2000_v1.tpc", "gm_de431.tpc",
    "moon_pa_de440_200625.bpc", "moon_de440_250416.tf", "moon_assoc_me.tf", "naif0012.tls",
}
records = [row for row in bootstrap.pinned_kernel_records(manifest, root) if row["name"] in required]
assert {row["name"] for row in records} == required, "Incomplete pinned web kernel inventory"
for row in records:
    bootstrap.ensure_download(root / "target/kernels" / row["name"], row["url"], row["sha256"])
    print("Verified " + row["name"], flush=True)
(root / "target/web-kernels.json").write_text(json.dumps(records, indent=2) + "\n")
