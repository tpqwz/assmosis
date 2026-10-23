#!/usr/bin/env python3
"""Bake the CA list, time zones, and default sources into headers for the fetcher."""
import hashlib
import os
import sys
from pathlib import Path

gen, sources = sys.argv[1], sys.argv[2]
gen = Path(gen)
gen.mkdir(parents=True, exist_ok=True)

trust = Path("/tmp/trust_anchors.h")
if not trust.exists():
    raise SystemExit("missing /tmp/trust_anchors.h — run brssl ta on a CA bundle first")
(gen / "trust_anchors.h").write_bytes(trust.read_bytes())

text = Path(sources).read_text(encoding="utf-8")
escaped = text.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
(gen / "embedded_sources.h").write_text(
    "static const char EMBEDDED_SOURCES[] =\n\"" + escaped + "\";\n",
    encoding="utf-8",
)

root = Path("/usr/share/zoneinfo")
skip = {"zone.tab", "zone1970.tab", "tzdata.zi", "iso3166.tab", "leapseconds", "leap-seconds.list"}
blobs = {}
order = []
items = []
for dirpath, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d not in ("posix", "right")]
    for name in files:
        if name in skip:
            continue
        path = Path(dirpath) / name
        try:
            data = path.resolve().read_bytes()
        except OSError:
            continue
        if not data.startswith(b"TZif"):
            continue
        digest = hashlib.sha256(data).digest()
        if digest not in blobs:
            blobs[digest] = data
            order.append(digest)
        items.append((str(path.relative_to(root)), digest))
items.sort()
parts = []
offset = 0
index = {}
for digest in order:
    data = blobs[digest]
    index[digest] = (offset, len(data))
    offset += len(data)
blob = b"".join(blobs[d] for d in order)
out = ["static const unsigned char ZONE_BLOB[] = {"]
for i in range(0, len(blob), 20):
    chunk = blob[i : i + 20]
    out.append("  " + ",".join(str(b) for b in chunk) + ",")
out.append("};")
out.append("typedef struct { const char *name; unsigned offset; unsigned length; } ZoneRef;")
out.append("static const ZoneRef ZONE_REFS[] = {")
for name, digest in items:
    off, length = index[digest]
    esc = name.replace("\\", "\\\\").replace('"', '\\"')
    out.append(f'  {{"{esc}", {off}, {length}}},')
out.append("};")
out.append(f"static const int ZONE_COUNT = {len(items)};")
(gen / "zones.inc").write_text("\n".join(out) + "\n", encoding="utf-8")
print(f"zones {len(items)} blob {len(blob)}")
