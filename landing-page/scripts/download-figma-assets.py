#!/usr/bin/env python3
"""
Download Figma MCP asset URLs referenced in landing/*.html into landing/assets/images/
and rewrite src attributes to local paths.

Re-run after changing Figma exports or adding new remote asset URLs.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

LANDING = Path(__file__).resolve().parent.parent
HTML_GLOB = "*.html"
ASSET_DIR = LANDING / "assets" / "images"
URL_RE = re.compile(
    r"https://www\.figma\.com/api/mcp/asset/([a-f0-9-]+)", re.IGNORECASE
)

MIME_TO_EXT = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def collect_uuids() -> set[str]:
    uuids: set[str] = set()
    for html in LANDING.glob(HTML_GLOB):
        uuids.update(URL_RE.findall(html.read_text(encoding="utf-8")))
    return uuids


def mime_type(path: Path) -> str:
    r = subprocess.run(
        ["file", "-b", "--mime-type", str(path)],
        capture_output=True,
        text=True,
        check=True,
    )
    return r.stdout.strip()


def download_one(uid: str) -> tuple[str, Path] | tuple[None, None]:
    url = f"https://www.figma.com/api/mcp/asset/{uid}"
    tmp = ASSET_DIR / f"{uid}.part"
    r = subprocess.run(
        ["curl", "-sfL", url, "-o", str(tmp)],
        capture_output=True,
    )
    if r.returncode != 0 or not tmp.exists() or tmp.stat().st_size == 0:
        if tmp.exists():
            tmp.unlink(missing_ok=True)
        print(f"  curl failed: {uid}", file=sys.stderr)
        return None, None
    mt = mime_type(tmp)
    ext = MIME_TO_EXT.get(mt)
    if not ext:
        print(f"  unknown type {mt!r}: {uid}", file=sys.stderr)
        tmp.unlink(missing_ok=True)
        return None, None
    dest = ASSET_DIR / f"{uid}{ext}"
    tmp.replace(dest)
    return uid, dest


def main() -> int:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    uuids = collect_uuids()
    if not uuids:
        print("No Figma MCP asset URLs found in HTML.")
        return 0

    mapping: dict[str, str] = {}
    for uid in sorted(uuids):
        _, dest = download_one(uid)
        if dest is not None:
            mapping[uid] = dest.suffix
            print(f"  {uid}{dest.suffix}")

    missing = uuids - set(mapping)
    if missing:
        print(f"Missing {len(missing)} asset(s); HTML not rewritten.", file=sys.stderr)
        return 1

    for html in sorted(LANDING.glob(HTML_GLOB)):
        text = html.read_text(encoding="utf-8")

        def repl(m: re.Match[str]) -> str:
            u = m.group(1)
            return f"assets/images/{u}{mapping[u]}"

        new = URL_RE.sub(repl, text)
        if new != text:
            html.write_text(new, encoding="utf-8")
            print(f"updated {html.name}")

    print(f"Done: {len(mapping)} files in {ASSET_DIR.relative_to(LANDING)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
