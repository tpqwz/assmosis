#!/bin/sh
# Rebuild the portable list fetcher. Needs cosmocc on PATH (https://cosmo.zip/pub/cosmocc/).
set -e
ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
GEN=${GEN:-/tmp/assmosis-gen}
COSMOCC=${COSMOCC:-cosmocc}
mkdir -p "$GEN"
python3 "$ROOT/tools/listfetch/gen-data.py" "$GEN" "$ROOT/tools/sources.json"
OBJS=$(ls "${BR_OBJ:-/tmp/br-obj}"/*.o)
"$COSMOCC" -O2 -I"$GEN" -I"$ROOT/tools/listfetch" -I"$ROOT/tools/vendor" -I"${BEAR_INC:-/tmp/bearssl-0.6/inc}" \
  -o "$ROOT/tools/assmosis-lists" \
  "$ROOT/tools/listfetch/assmosis-lists.c" \
  "$ROOT/tools/listfetch/htmlmeet.c" \
  "$ROOT/tools/listfetch/https.c" \
  "$ROOT/tools/listfetch/tz.c" \
  "$ROOT/tools/vendor/cJSON.c" \
  $OBJS
echo "built $ROOT/tools/assmosis-lists"
