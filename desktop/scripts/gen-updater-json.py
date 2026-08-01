#!/usr/bin/env python3
"""Generate a Tauri v2 updater manifest (latest-<target>.json).

The tauri CLI only writes a minisign signature (<bundle>.sig) per bundle; the
updater manifest itself is normally produced by tauri-action. Since this repo
uploads release assets with softprops, the manifest is built here from the
CLI-produced signature and the final download URL.
"""

from __future__ import annotations

import argparse
import glob
import json
from datetime import datetime, timezone


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--target", required=True, help="e.g. linux-x86_64")
    p.add_argument("--version", required=True, help="e.g. 0.1.0")
    p.add_argument(
        "--bundle-sig", required=True, help="path or glob to the <bundle>.sig file"
    )
    p.add_argument("--bundle-url", required=True, help="final download URL of the bundle")
    p.add_argument("--out", required=True, help="output file, e.g. latest-linux-x86_64.json")
    args = p.parse_args()

    sigs = glob.glob(args.bundle_sig)
    if not sigs:
        raise SystemExit(f"no signature file found matching {args.bundle_sig!r}")
    with open(sigs[0]) as f:
        signature = f.read().strip()

    manifest = {
        "version": args.version,
        "notes": "",
        "pub_date": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "platforms": {
            args.target: {
                "signature": signature,
                "url": args.bundle_url,
            }
        },
    }

    with open(args.out, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
