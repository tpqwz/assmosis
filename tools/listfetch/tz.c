#include "tz.h"

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include "zones.inc"

static uint32_t be32(const unsigned char *p) {
  return ((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) | ((uint32_t)p[2] << 8) | p[3];
}

static int64_t be64s(const unsigned char *p) {
  uint64_t u = 0;
  for (int i = 0; i < 8; i++) u = (u << 8) | p[i];
  return (int64_t)u;
}

static const unsigned char *find_zone(const char *name, size_t *len) {
  if (!name || !name[0]) return NULL;
  int lo = 0, hi = ZONE_COUNT - 1;
  while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    int cmp = strcmp(name, ZONE_REFS[mid].name);
    if (cmp == 0) {
      *len = ZONE_REFS[mid].length;
      return ZONE_BLOB + ZONE_REFS[mid].offset;
    }
    if (cmp < 0) hi = mid - 1;
    else lo = mid + 1;
  }
  return NULL;
}

static int offset_at(const unsigned char *p, size_t n, time_t epoch, long *off) {
  size_t i = 0;
  char version = 0;
  uint32_t ttisut = 0, ttisstd = 0, leap = 0, timecnt = 0, typecnt = 0, charcnt = 0;
  if (n < 44 || memcmp(p, "TZif", 4) != 0) return 0;
  version = (char)p[4];
  ttisut = be32(p + 20);
  ttisstd = be32(p + 24);
  leap = be32(p + 28);
  timecnt = be32(p + 32);
  typecnt = be32(p + 36);
  charcnt = be32(p + 40);
  i = 44;
  int wide = version >= '2';
  if (wide) {
    size_t skip = (size_t)timecnt * 4u + timecnt + (size_t)typecnt * 6u + charcnt + (size_t)leap * 8u + ttisstd + ttisut;
    if (i + skip + 44 > n) return 0;
    i += skip;
    if (memcmp(p + i, "TZif", 4) != 0) return 0;
    ttisut = be32(p + i + 20);
    ttisstd = be32(p + i + 24);
    leap = be32(p + i + 28);
    timecnt = be32(p + i + 32);
    typecnt = be32(p + i + 36);
    charcnt = be32(p + i + 40);
    i += 44;
  }
  size_t time_bytes = wide ? 8u : 4u;
  if (typecnt == 0 || typecnt > 1000 || timecnt > 200000) return 0;
  if (i + (size_t)timecnt * time_bytes + timecnt + (size_t)typecnt * 6u > n) return 0;
  const unsigned char *times = p + i;
  i += (size_t)timecnt * time_bytes;
  const unsigned char *types = p + i;
  i += timecnt;
  const unsigned char *infos = p + i;
  int use = 0;
  int found = 0;
  for (uint32_t t = 0; t < timecnt; t++) {
    int64_t when = wide ? be64s(times + (size_t)t * 8u) : (int32_t)be32(times + (size_t)t * 4u);
    if (when <= (int64_t)epoch) {
      use = types[t];
      found = 1;
    } else break;
  }
  if (!found) {
    use = 0;
    for (uint32_t t = 0; t < typecnt; t++) {
      if (infos[(size_t)t * 6u + 4] == 0) {
        use = (int)t;
        break;
      }
    }
  }
  if (use < 0 || (uint32_t)use >= typecnt) return 0;
  const unsigned char *info = infos + (size_t)use * 6u;
  *off = (int32_t)be32(info);
  return 1;
}

int zone_known(const char *name) {
  size_t n = 0;
  return find_zone(name, &n) != NULL;
}

int zone_local(const char *name, time_t epoch, struct tm *out) {
  size_t n = 0;
  const unsigned char *p = find_zone(name, &n);
  long off = 0;
  if (!p || !offset_at(p, n, epoch, &off)) return 0;
  time_t local = epoch + off;
  gmtime_r(&local, out);
  return 1;
}
