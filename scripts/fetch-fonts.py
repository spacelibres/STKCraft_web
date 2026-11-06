"""Download the OFL families used by the site and rewrite Google Fonts URLs locally.

Run from the repository root:  python scripts/fetch-fonts.py
"""
from __future__ import annotations

import hashlib
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / "assets" / "fonts"
CSS_OUT = ROOT / "css" / "fonts.css"

CSS_URL = (
    "https://fonts.googleapis.com/css2"
    "?family=Archivo:wdth,wght@62..125,100..900"
    "&family=Inter:wght@100..900"
    "&family=Instrument+Serif:ital@0;1"
    "&family=Geist+Mono:wght@100..900"
    "&display=swap"
)
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
)
LICENCES = {
    "archivo": "https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/OFL.txt",
    "inter": "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt",
    "instrument-serif": "https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/OFL.txt",
    "geist-mono": "https://raw.githubusercontent.com/google/fonts/main/ofl/geistmono/OFL.txt",
}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.read()


def main() -> None:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    css = get(CSS_URL).decode("utf-8")
    urls = re.findall(r"url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)", css)
    for url in dict.fromkeys(urls):
        name = hashlib.sha256(url.encode()).hexdigest()[:16] + ".woff2"
        data = get(url)
        (FONT_DIR / name).write_bytes(data)
        css = css.replace(url, f"../assets/fonts/{name}")
    CSS_OUT.write_text(css, encoding="utf-8")
    for slug, url in LICENCES.items():
        (FONT_DIR / f"OFL-{slug}.txt").write_bytes(get(url))
    print(f"fonts: {len(set(urls))} files, {CSS_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
