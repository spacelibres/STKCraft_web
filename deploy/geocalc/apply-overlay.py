"""Apply the public-host UI overlay; calculations and kernels are untouched."""
import subprocess
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()
relative = "web/components/Workspace.tsx"
original = subprocess.check_output(["git", "show", "HEAD:" + relative], cwd=root).decode()
file = root / relative
assert file.read_text() == original, "Workspace source is not clean"
changes = {
    "value+60)),1000)": "value+60)),5000)",
    'className="brand" href="/" aria-label="STKCraft home"':
        'className="brand" href="https://www.stkcraft.com/" aria-label="STKCraft home"',
}
updated = original
for before, after in changes.items():
    assert updated.count(before) == 1, "Upstream UI changed; review deployment overlay"
    updated = updated.replace(before, after)
file.write_text(updated)
print("Applied public-host home link and five-second playback interval")
