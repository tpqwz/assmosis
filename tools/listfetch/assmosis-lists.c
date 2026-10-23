/* Assmosis list fetcher. One Actually Portable Executable: no Python, no packages.
   Reads tools/sources.json (or sources.json beside the program, or the copy baked in).
   Kinds: teamup, gsheets, tsml, html. Import the CSV or Excel file from Settings → Merge. */
#include "https.h"
#include "tz.h"
#include "htmlmeet.h"
#include "cJSON.h"

#include <ctype.h>
#include <errno.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <sys/stat.h>
#include <time.h>

#include "embedded_sources.h"

static const char *WEEKDAYS[] = {"", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};
static const char *HEADERS[] = {
    "Name", "Weekday", "Time", "Timezone", "Duration Minutes", "Platform", "Meeting ID", "Password",
    "Join URL", "Notes", "Contact", "Gender", "Program", "Language", "Location"};

typedef struct {
  char name[128];
  int weekday, hour, minute, duration;
  char zone[80];
  char platform[16];
  char meeting_id[256];
  char password[32];
  char join[512];
  char notes[1600];
  char contact[256];
  char gender[16];
  char program[32];
  char language[40];
  char location[180];
} Row;

typedef struct {
  Row *a;
  int n, cap;
} Rows;

static void die_mem(void) {
  fprintf(stderr, "out of memory\n");
  exit(1);
}

static void put(char *dst, size_t n, const char *src) {
  if (!src) src = "";
  snprintf(dst, n, "%s", src);
}

static int ci_eq(const char *a, const char *b) {
  if (!a || !b) return 0;
  while (*a && *b) {
    if (tolower((unsigned char)*a) != tolower((unsigned char)*b)) return 0;
    a++;
    b++;
  }
  return *a == 0 && *b == 0;
}

static const char *ci_find(const char *hay, const char *needle) {
  if (!hay || !needle || !needle[0]) return NULL;
  size_t n = strlen(needle);
  for (const char *p = hay; *p; p++) {
    size_t i = 0;
    while (i < n && p[i] && tolower((unsigned char)p[i]) == tolower((unsigned char)needle[i])) i++;
    if (i == n) return p;
  }
  return NULL;
}

static int contains_ci(const char *hay, const char *needle) { return ci_find(hay, needle) != NULL; }

static void trim(char *s) {
  if (!s) return;
  char *a = s;
  while (*a && isspace((unsigned char)*a)) a++;
  if (a != s) memmove(s, a, strlen(a) + 1);
  size_t n = strlen(s);
  while (n && isspace((unsigned char)s[n - 1])) s[--n] = 0;
}

static void collapse_spaces(char *s) {
  char *w = s;
  int space = 0;
  for (char *p = s; *p; p++) {
    if (*p == '\n' || *p == '\r' || *p == '\t') *p = ' ';
    if (*p == ' ') {
      if (space) continue;
      space = 1;
    } else space = 0;
    *w++ = *p;
  }
  *w = 0;
  trim(s);
}

static void cap_copy(char *dst, size_t n, const char *src) {
  put(dst, n, src ? src : "");
  trim(dst);
}

static void row_init(Row *r, const char *program) {
  memset(r, 0, sizeof *r);
  r->duration = 60;
  put(r->gender, sizeof r->gender, "ALL");
  put(r->language, sizeof r->language, "English");
  put(r->zone, sizeof r->zone, "America/New_York");
  put(r->program, sizeof r->program, program ? program : "");
}

static void add_row(Rows *rs, const Row *r) {
  if (r->weekday < 1 || r->weekday > 7) return;
  if (!r->name[0] || !r->platform[0]) return;
  if (rs->n == rs->cap) {
    rs->cap = rs->cap ? rs->cap * 2 : 32;
    Row *nb = realloc(rs->a, (size_t)rs->cap * sizeof(Row));
    if (!nb) die_mem();
    rs->a = nb;
  }
  rs->a[rs->n++] = *r;
}

static char *js(const cJSON *obj, const char *key) {
  cJSON *item = cJSON_GetObjectItemCaseSensitive(obj, key);
  if (cJSON_IsString(item) && item->valuestring) return item->valuestring;
  return "";
}

static int jint(const cJSON *obj, const char *key, int fallback) {
  cJSON *item = cJSON_GetObjectItemCaseSensitive(obj, key);
  if (cJSON_IsNumber(item)) return item->valueint;
  return fallback;
}

static int teen(const char *text) {
  return contains_ci(text, "alateen") || contains_ci(text, "narateen") || contains_ci(text, "s-ateen") ||
         contains_ci(text, "gam-a-teen") || ci_find(text, "teen") == text ||
         (ci_find(text, " teen") != NULL) || contains_ci(text, "\nteen");
}

static void gender_for(const char *text, char *dst, size_t n) {
  if (contains_ci(text, "women")) put(dst, n, "WOMEN_ONLY");
  else if (contains_ci(text, "men only") || contains_ci(text, "men's") || contains_ci(text, "mens only"))
    put(dst, n, "MEN_ONLY");
  else put(dst, n, "ALL");
}

static int human_pw(const char *value, char *dst, size_t n) {
  char buf[64];
  put(buf, sizeof buf, value);
  trim(buf);
  size_t len = strlen(buf);
  while (len && (buf[len - 1] == '#' || buf[len - 1] == '.')) buf[--len] = 0;
  while (buf[0] == '#') memmove(buf, buf + 1, strlen(buf));
  len = strlen(buf);
  if (!len || len > 24 || len >= n) return 0;
  if (len >= 18) {
    int sym = 1;
    for (size_t i = 0; i < len; i++) {
      char c = buf[i];
      if (!isalnum((unsigned char)c) && !strchr("+/_.=-", c)) sym = 0;
    }
    if (sym) return 0;
  }
  if (ci_eq(buf, "for") || ci_eq(buf, "the") || ci_eq(buf, "is") || ci_eq(buf, "required") || ci_eq(buf, "protected") ||
      ci_eq(buf, "none") || ci_eq(buf, "optional") || ci_eq(buf, "meeting"))
    return 0;
  put(dst, n, buf);
  return 1;
}

static int clock_ampm(const char *text, int *hour, int *minute) {
  if (!text) return 0;
  for (const char *p = text; *p; p++) {
    if (!isdigit((unsigned char)*p)) continue;
    int h = 0, m = 0, any = 0;
    const char *q = p;
    while (isdigit((unsigned char)*q)) {
      h = h * 10 + (*q - '0');
      q++;
      any = 1;
    }
    if (!any || h > 24) continue;
    if (*q == ':') {
      q++;
      if (!isdigit((unsigned char)q[0])) continue;
      m = (q[0] - '0') * 10;
      if (isdigit((unsigned char)q[1])) {
        m += q[1] - '0';
        q += 2;
      } else q++;
    }
    while (*q == ' ' || *q == '.') q++;
    int pm = 0, am = 0;
    if (tolower((unsigned char)q[0]) == 'a' || tolower((unsigned char)q[0]) == 'p') {
      pm = tolower((unsigned char)q[0]) == 'p';
      am = !pm;
      q++;
      if (*q == '.') q++;
      if (tolower((unsigned char)*q) == 'm') q++;
    }
    if (!am && !pm) continue;
    if (m > 59 || h > 12) continue;
    if (pm && h != 12) h += 12;
    if (am && h == 12) h = 0;
    *hour = h;
    *minute = m;
    return 1;
  }
  return 0;
}

static int parse_hhmm(const char *text, int *hour, int *minute) {
  int h = 0, m = 0;
  if (!text || sscanf(text, "%d:%d", &h, &m) < 1) return 0;
  if (h < 0 || h > 23 || m < 0 || m > 59) return 0;
  *hour = h;
  *minute = m;
  return 1;
}

static int duration_between(const char *start, const char *end) {
  int sh, sm, eh, em;
  if (!parse_hhmm(start, &sh, &sm) || !parse_hhmm(end, &eh, &em)) return 60;
  int mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  if (mins < 15 || mins > 240) return 60;
  return mins;
}

static time_t ymd_to_epoch(int y, int mo, int d, int H, int M, int S) {
  y -= mo <= 2;
  int era = (y >= 0 ? y : y - 399) / 400;
  unsigned yoe = (unsigned)(y - era * 400);
  unsigned doy = (153u * (unsigned)(mo + (mo > 2 ? -3 : 9)) + 2u) / 5u + (unsigned)d - 1u;
  unsigned doe = yoe * 365u + yoe / 4u - yoe / 100u + doy;
  long days = (long)era * 146097L + (long)doe - 719468L;
  return (time_t)days * 86400 + H * 3600 + M * 60 + S;
}

static int parse_iso(const char *s, time_t *epoch) {
  int Y, M, D, h, m, sec;
  if (!s || sscanf(s, "%d-%d-%dT%d:%d:%d", &Y, &M, &D, &h, &m, &sec) < 6) return 0;
  const char *t = strchr(s, 'T');
  const char *z = t ? strpbrk(t + 1, "Z+-") : NULL;
  long off = 0;
  if (z && *z != 'Z') {
    int oh = 0, om = 0, sign = *z == '-' ? -1 : 1;
    sscanf(z + 1, "%d:%d", &oh, &om);
    off = sign * (oh * 3600L + om * 60L);
  }
  *epoch = ymd_to_epoch(Y, M, D, h, m, sec) - off;
  return 1;
}

static int wall(const char *zone, time_t epoch, int *weekday, int *hour, int *minute) {
  struct tm tm;
  if (!zone_known(zone) || !zone_local(zone, epoch, &tm)) return 0;
  *weekday = tm.tm_wday == 0 ? 7 : tm.tm_wday;
  *hour = tm.tm_hour;
  *minute = tm.tm_min;
  return 1;
}

static const char *alias_zone(const char *token) {
  struct {
    const char *a, *z;
  } map[] = {
      {"ET", "America/New_York"}, {"EST", "America/New_York"}, {"EDT", "America/New_York"}, {"Eastern", "America/New_York"},
      {"CT", "America/Chicago"},  {"CST", "America/Chicago"},  {"CDT", "America/Chicago"},  {"Central", "America/Chicago"},
      {"MT", "America/Denver"},   {"MST", "America/Denver"},   {"MDT", "America/Denver"},   {"Mountain", "America/Denver"},
      {"PT", "America/Los_Angeles"}, {"PST", "America/Los_Angeles"}, {"PDT", "America/Los_Angeles"},
      {"Pacific", "America/Los_Angeles"}, {"GMT", "Etc/UTC"}, {"UTC", "UTC"}, {"UK", "Europe/London"},
      {"London", "Europe/London"}, {"CET", "Europe/Berlin"}, {0, 0}};
  for (int i = 0; map[i].a; i++)
    if (ci_eq(token, map[i].a)) return map[i].z;
  return NULL;
}

static int usable_zone(const char *name, char *dst, size_t n) {
  if (!name || !name[0]) return 0;
  if (zone_known(name)) {
    put(dst, n, name);
    return 1;
  }
  const char *a = alias_zone(name);
  if (a && zone_known(a)) {
    put(dst, n, a);
    return 1;
  }
  return 0;
}

static int guess_zone(const char *text, char *dst, size_t n) {
  if (!text || !text[0]) return 0;
  struct {
    const char *k, *z;
  } keys[] = {
      {"Ubud", "Asia/Makassar"}, {"Bali", "Asia/Makassar"}, {"Indonesia", "Asia/Makassar"}, {"Jakarta", "Asia/Jakarta"},
      {"Paris", "Europe/Paris"}, {"France", "Europe/Paris"}, {"Madrid", "Europe/Madrid"}, {"Barcelona", "Europe/Madrid"},
      {"Spain", "Europe/Madrid"}, {"Warsaw", "Europe/Warsaw"}, {"Warszawa", "Europe/Warsaw"}, {"Krakow", "Europe/Warsaw"},
      {"Kraków", "Europe/Warsaw"}, {"Poland", "Europe/Warsaw"}, {"Stockholm", "Europe/Stockholm"}, {"Sweden", "Europe/Stockholm"},
      {"Moscow", "Europe/Moscow"}, {"Moskva", "Europe/Moscow"}, {"Russia", "Europe/Moscow"}, {"Beijing", "Asia/Shanghai"},
      {"China", "Asia/Shanghai"}, {"Bogota", "America/Bogota"}, {"Bogotá", "America/Bogota"}, {"Colombia", "America/Bogota"},
      {"Sydney", "Australia/Sydney"}, {"Australia", "Australia/Sydney"}, {"Auckland", "Pacific/Auckland"},
      {"New Zealand", "Pacific/Auckland"}, {"London", "Europe/London"}, {"England", "Europe/London"},
      {"United Kingdom", "Europe/London"}, {"Ireland", "Europe/Dublin"}, {"Galway", "Europe/Dublin"},
      {"Vancouver", "America/Vancouver"}, {"Toronto", "America/Toronto"}, {"Ontario", "America/Toronto"},
      {"Canada", "America/Toronto"}, {"Honolulu", "Pacific/Honolulu"}, {"Hawaii", "Pacific/Honolulu"},
      {"Alaska", "America/Anchorage"}, {"Phoenix", "America/Phoenix"}, {"Arizona", "America/Phoenix"},
      {"Denver", "America/Denver"}, {"Chicago", "America/Chicago"}, {"Los Angeles", "America/Los_Angeles"},
      {"New York", "America/New_York"}, {0, 0}};
  for (int i = 0; keys[i].k; i++) {
    if (contains_ci(text, keys[i].k) && zone_known(keys[i].z)) {
      put(dst, n, keys[i].z);
      return 1;
    }
  }
  static const char *states[] = {
      "AL", "America/Chicago", "AK", "America/Anchorage", "AZ", "America/Phoenix", "AR", "America/Chicago",
      "CA", "America/Los_Angeles", "CO", "America/Denver", "CT", "America/New_York", "DC", "America/New_York",
      "DE", "America/New_York", "FL", "America/New_York", "GA", "America/New_York", "HI", "Pacific/Honolulu",
      "IA", "America/Chicago", "ID", "America/Boise", "IL", "America/Chicago", "IN", "America/Indiana/Indianapolis",
      "KS", "America/Chicago", "KY", "America/New_York", "LA", "America/Chicago", "MA", "America/New_York",
      "MD", "America/New_York", "ME", "America/New_York", "MI", "America/Detroit", "MN", "America/Chicago",
      "MO", "America/Chicago", "MS", "America/Chicago", "MT", "America/Denver", "NC", "America/New_York",
      "ND", "America/Chicago", "NE", "America/Chicago", "NH", "America/New_York", "NJ", "America/New_York",
      "NM", "America/Denver", "NV", "America/Los_Angeles", "NY", "America/New_York", "OH", "America/New_York",
      "OK", "America/Chicago", "OR", "America/Los_Angeles", "PA", "America/New_York", "RI", "America/New_York",
      "SC", "America/New_York", "SD", "America/Chicago", "TN", "America/Chicago", "TX", "America/Chicago",
      "UT", "America/Denver", "VA", "America/New_York", "VT", "America/New_York", "WA", "America/Los_Angeles",
      "WI", "America/Chicago", "WV", "America/New_York", "WY", "America/Denver", 0};
  for (int i = 0; states[i]; i += 2) {
    char pat[8];
    snprintf(pat, sizeof pat, ", %s", states[i]);
    if (contains_ci(text, pat) || contains_ci(text, states[i + 0]) && strstr(text, "USA")) {
      if (contains_ci(text, pat) && zone_known(states[i + 1])) {
        put(dst, n, states[i + 1]);
        return 1;
      }
    }
  }
  return 0;
}

static void digits_only(const char *src, char *dst, size_t n, int keep_leading_zeros) {
  size_t w = 0;
  (void)keep_leading_zeros;
  for (const char *p = src; *p && w + 1 < n; p++)
    if (isdigit((unsigned char)*p)) dst[w++] = *p;
  dst[w] = 0;
}

static void normalize_phone(char *digits, const char *context) {
  if (!strncmp(digits, "00", 2)) memmove(digits, digits + 2, strlen(digits + 2) + 1);
  size_t n = strlen(digits);
  char prefixed[40];
  const char *cc = NULL;
  if (n == 10) cc = "1";
  else if (n == 11 && digits[0] == '1') cc = NULL;
  else if (n > 0 && n < 10) {
    if (contains_ci(context, "poland") || contains_ci(context, "warszawa") || contains_ci(context, "krak")) cc = "48";
    else if (contains_ci(context, "sweden") || contains_ci(context, "stockholm")) cc = "46";
    else if (contains_ci(context, "france") || contains_ci(context, "paris")) cc = "33";
    else if (contains_ci(context, "united kingdom") || contains_ci(context, "england") || contains_ci(context, "london"))
      cc = "44";
    else if (contains_ci(context, "australia") || contains_ci(context, "sydney")) cc = "61";
  }
  if (cc) {
    snprintf(prefixed, sizeof prefixed, "%s%s", cc, digits);
    put(digits, 40, prefixed);
  }
}

static int grab_phone(const char *text, const char *context, char *dst, size_t n) {
  const char *labels[] = {"call-in number", "call in number", "call-in:", "call in:", "dial-in", "dial in",
                         "phone number", "phone:", "telephone", "access number", 0};
  const char *at = NULL;
  for (int i = 0; labels[i]; i++) {
    at = ci_find(text, labels[i]);
    if (at) {
      at += strlen(labels[i]);
      break;
    }
  }
  if (!at) return 0;
  const char *p = at;
  for (int guard = 0; *p && guard < 200; p++, guard++) {
    if (isdigit((unsigned char)*p) || *p == '+' || *p == '(') break;
  }
  if (!isdigit((unsigned char)*p) && *p != '+' && *p != '(') return 0;
  char raw[80];
  size_t w = 0;
  for (; *p && w + 1 < sizeof raw; p++) {
    if (isdigit((unsigned char)*p) || *p == '+' || *p == '-' || *p == ' ' || *p == '(' || *p == ')') raw[w++] = *p;
    else break;
  }
  raw[w] = 0;
  char digs[40];
  digits_only(raw, digs, sizeof digs, 1);
  if (strlen(digs) < 7 || strlen(digs) > 15) return 0;
  normalize_phone(digs, context);
  if (strlen(digs) < 10 || strlen(digs) > 15) return 0;
  put(dst, n, digs);
  return 1;
}

static int collect_zoom(const char *text, char ids[][16], int max) {
  int n = 0;
  for (const char *p = text; *p && n < max;) {
    const char *z = ci_find(p, "zoom.us/j/");
    if (!z) break;
    z += strlen("zoom.us/j/");
    char digs[16];
    size_t w = 0;
    while (isdigit((unsigned char)*z) && w + 1 < sizeof digs) digs[w++] = *z++;
    digs[w] = 0;
    if (w >= 9 && w <= 12) {
      int seen = 0;
      for (int i = 0; i < n; i++)
        if (!strcmp(ids[i], digs)) seen = 1;
      if (!seen) put(ids[n++], 16, digs);
    }
    p = z;
  }
  for (const char *p = text; *p && n < max;) {
    const char *m = ci_find(p, "meeting id");
    if (!m) m = ci_find(p, "zoom id");
    if (!m) m = ci_find(p, "zoom code");
    if (!m) break;
    m = strchr(m, ':');
    if (!m) break;
    m++;
    char digs[16];
    size_t w = 0;
    for (int guard = 0; *m && guard < 24 && w + 1 < sizeof digs; m++, guard++) {
      if (isdigit((unsigned char)*m)) digs[w++] = *m;
      else if (w && *m != ' ' && *m != '-') break;
    }
    digs[w] = 0;
    if (w >= 9 && w <= 12) {
      int seen = 0;
      for (int i = 0; i < n; i++)
        if (!strcmp(ids[i], digs)) seen = 1;
      if (!seen) put(ids[n++], 16, digs);
    }
    p = m;
  }
  return n;
}

static void password_from(const char *text, char *dst, size_t n) {
  dst[0] = 0;
  const char *keys[] = {"passcode", "pass-code", "password", 0};
  for (int k = 0; keys[k]; k++) {
    const char *p = ci_find(text, keys[k]);
    if (!p) continue;
    p += strlen(keys[k]);
    while (*p == ' ' || *p == ':' || *p == '-') p++;
    if (ci_find(p, "is ") == p) p += 3;
    while (*p == ' ' || *p == ':') p++;
    char tok[40];
    size_t w = 0;
    while (p[w] && (isalnum((unsigned char)p[w]) || p[w] == '#') && w + 1 < sizeof tok) {
      tok[w] = p[w];
      w++;
    }
    tok[w] = 0;
    if (human_pw(tok, dst, n)) return;
  }
  const char *c = ci_find(text, "code:");
  if (!c) c = ci_find(text, "code ");
  if (!c) return;
  c = strchr(c, ':');
  if (!c) return;
  c++;
  while (*c == ' ') c++;
  if (!strncasecmp(c, "meeting", 7)) return;
  char tok[40];
  size_t w = 0;
  while (c[w] && (isdigit((unsigned char)c[w]) || c[w] == '#') && w + 1 < sizeof tok) {
    tok[w] = c[w];
    w++;
  }
  tok[w] = 0;
  human_pw(tok, dst, n);
}

static void first_zoom_url(const char *text, const char *id, char *dst, size_t n) {
  const char *p = text;
  char needle[64];
  snprintf(needle, sizeof needle, "zoom.us/j/%s", id);
  const char *hit = ci_find(p, needle);
  if (!hit) {
    snprintf(dst, n, "https://zoom.us/j/%s", id);
    return;
  }
  const char *start = hit;
  while (start > text && start[-1] != ' ' && start[-1] != '\n' && start[-1] != '"' && start[-1] != '<') start--;
  if (ci_find(start, "https://") == start || ci_find(start, "http://") == start) {
    size_t w = 0;
    while (start[w] && start[w] != ' ' && start[w] != '"' && start[w] != '<' && start[w] != '\n' && w + 1 < n) {
      dst[w] = start[w];
      w++;
    }
    dst[w] = 0;
  } else snprintf(dst, n, "https://zoom.us/j/%s", id);
}

static void language_from_types(const cJSON *types, const char *text, const char *name, char *lang, size_t n, char *note, size_t noten) {
  const char *names[8];
  int count = 0, english = 0;
  if (cJSON_IsArray(types)) {
    cJSON *item;
    cJSON_ArrayForEach(item, types) {
      const char *code = cJSON_IsString(item) ? item->valuestring : "";
      const char *label = NULL;
      if (ci_eq(code, "EN")) {
        label = "English";
        english = 1;
      } else if (ci_eq(code, "ES")) label = "Spanish";
      else if (ci_eq(code, "PL")) label = "Polish";
      else if (ci_eq(code, "FA")) label = "Persian";
      else if (ci_eq(code, "SV")) label = "Swedish";
      else if (ci_eq(code, "FR")) label = "French";
      else if (ci_eq(code, "RU")) label = "Russian";
      else if (ci_eq(code, "ZH")) label = "Chinese";
      else if (ci_eq(code, "DE")) label = "German";
      else if (ci_eq(code, "PT")) label = "Portuguese";
      else if (ci_eq(code, "HE")) label = "Hebrew";
      else if (ci_eq(code, "AR")) label = "Arabic";
      if (label && count < 8) names[count++] = label;
    }
  }
  if (count == 1) {
    put(lang, n, names[0]);
    return;
  }
  if (count > 1) {
    put(lang, n, english ? "English" : names[0]);
    char extra[180] = "";
    for (int i = 0; i < count; i++) {
      if (extra[0]) strncat(extra, ", ", sizeof extra - strlen(extra) - 1);
      strncat(extra, names[i], sizeof extra - strlen(extra) - 1);
    }
    if (!contains_ci(note, extra)) {
      char joined[1800];
      snprintf(joined, sizeof joined, "%s.\n%s", extra, note);
      cap_copy(note, noten, joined);
    }
    return;
  }
  if (contains_ci(text, "farsi") || contains_ci(text, "persian") || contains_ci(name, "persian")) put(lang, n, "Persian");
  else if (contains_ci(text, "polish-language") || contains_ci(text, "polsko") || contains_ci(name, "polish"))
    put(lang, n, "Polish");
  else if (contains_ci(text, "russian language") || contains_ci(text, "in russian")) put(lang, n, "Russian");
  else if (contains_ci(text, "held in french") || contains_ci(text, "in french")) put(lang, n, "French");
  else if (contains_ci(name, "SUBA")) put(lang, n, "Spanish");
  else if (contains_ci(text, "in spanish") || contains_ci(text, "español")) put(lang, n, "Spanish");
  else if (contains_ci(text, "in chinese") || contains_ci(text, "chinese")) put(lang, n, "Chinese");
  else put(lang, n, "English");
}

static void apply_place(Row *r, const char *blob, const char *address) {
  char ids[4][16];
  int nz = collect_zoom(blob, ids, 4);
  char phone[40];
  int has_phone = grab_phone(blob, blob, phone, sizeof phone);
  char skype[80];
  skype[0] = 0;
  const char *sk = ci_find(blob, "skype id");
  if (sk) {
    const char *c = strchr(sk, ':');
    if (c) {
      c++;
      while (*c == ' ') c++;
      size_t w = 0;
      while (c[w] && !isspace((unsigned char)c[w]) && c[w] != '<' && w + 1 < sizeof skype) {
        skype[w] = c[w];
        w++;
      }
      skype[w] = 0;
      trim(skype);
    }
  }
  password_from(blob, r->password, sizeof r->password);
  if (nz == 1) {
    put(r->platform, sizeof r->platform, "zoom");
    put(r->meeting_id, sizeof r->meeting_id, ids[0]);
    first_zoom_url(blob, ids[0], r->join, sizeof r->join);
    if (r->password[0]) {
      char *q = strchr(r->join, '?');
      if (q) *q = 0;
    }
  } else if (nz > 1) {
    r->platform[0] = 0;
  } else if (has_phone) {
    put(r->platform, sizeof r->platform, "phone");
    put(r->meeting_id, sizeof r->meeting_id, phone);
    snprintf(r->join, sizeof r->join, "tel:+%s", phone);
  } else if (skype[0]) {
    put(r->platform, sizeof r->platform, "skype");
    put(r->meeting_id, sizeof r->meeting_id, skype);
    snprintf(r->join, sizeof r->join, "skype:%s", skype);
  } else {
    put(r->platform, sizeof r->platform, "inperson");
    put(r->meeting_id, sizeof r->meeting_id, address && address[0] ? address : r->name);
    r->join[0] = 0;
    r->password[0] = 0;
  }
}

static int self_test(void) {
  int bad = 0;
  struct {
    const char *zone;
    int hour;
  } expect[] = {{"America/New_York", 8}, {"Europe/Paris", 14}, {"Asia/Makassar", 20}, {"Europe/Warsaw", 14}, {"America/Bogota", 7}, {0, 0}};
  for (int i = 0; expect[i].zone; i++) {
    int wd, h, m;
    if (!wall(expect[i].zone, 1761134400, &wd, &h, &m) || h != expect[i].hour) {
      fprintf(stderr, "zone %s hour %d, wanted %d\n", expect[i].zone, h, expect[i].hour);
      bad++;
    }
  }
  time_t epoch = 0;
  int wd, h, m;
  if (!parse_iso("2026-10-22T14:00:00-04:00", &epoch) || !wall("America/New_York", epoch, &wd, &h, &m) || h != 14 || m != 0) {
    fprintf(stderr, "iso conversion failed hour %d\n", h);
    bad++;
  }
  if (html_self_test()) bad++;
  if (!bad) printf("self-test ok\n");
  return bad ? 1 : 0;
}

typedef struct {
  char **cells;
  int n, cap;
} CsvRow;
typedef struct {
  CsvRow *rows;
  int n, cap;
} Grid;

static void grid_add_cell(CsvRow *row, const char *s, size_t n) {
  if (row->n == row->cap) {
    row->cap = row->cap ? row->cap * 2 : 8;
    char **nb = realloc(row->cells, (size_t)row->cap * sizeof(char *));
    if (!nb) die_mem();
    row->cells = nb;
  }
  char *cell = malloc(n + 1);
  if (!cell) die_mem();
  memcpy(cell, s, n);
  cell[n] = 0;
  row->cells[row->n++] = cell;
}

static void parse_csv(const char *s, Grid *g) {
  memset(g, 0, sizeof *g);
  if ((unsigned char)s[0] == 0xEF) s += 3;
  const char *p = s;
  char *field = NULL;
  size_t len = 0, cap = 0;
  int inq = 0, row_open = 0;
  CsvRow row;
  memset(&row, 0, sizeof row);
  while (*p) {
    char c = *p++;
    if (inq) {
      if (c == '"') {
        if (*p == '"') {
          p++;
          c = '"';
        } else {
          inq = 0;
          continue;
        }
      }
    } else {
      if (c == '"') {
        inq = 1;
        row_open = 1;
        continue;
      }
      if (c == ',') {
        grid_add_cell(&row, field ? field : "", len);
        len = 0;
        row_open = 1;
        continue;
      }
      if (c == '\n' || c == '\r') {
        if (c == '\r' && *p == '\n') p++;
        if (row_open || len || row.n) {
          grid_add_cell(&row, field ? field : "", len);
          if (g->n == g->cap) {
            g->cap = g->cap ? g->cap * 2 : 16;
            CsvRow *nb = realloc(g->rows, (size_t)g->cap * sizeof(CsvRow));
            if (!nb) die_mem();
            g->rows = nb;
          }
          g->rows[g->n++] = row;
          memset(&row, 0, sizeof row);
        }
        len = 0;
        row_open = 0;
        continue;
      }
    }
    if (len + 2 > cap) {
      cap = cap ? cap * 2 : 64;
      char *nb = realloc(field, cap);
      if (!nb) die_mem();
      field = nb;
    }
    field[len++] = c;
    row_open = 1;
  }
  if (row_open || len || row.n) {
    grid_add_cell(&row, field ? field : "", len);
    if (g->n == g->cap) {
      g->cap = g->cap ? g->cap * 2 : 16;
      g->rows = realloc(g->rows, (size_t)g->cap * sizeof(CsvRow));
      if (!g->rows) die_mem();
    }
    g->rows[g->n++] = row;
  }
  free(field);
}

static void free_grid(Grid *g) {
  for (int i = 0; i < g->n; i++) {
    for (int c = 0; c < g->rows[i].n; c++) free(g->rows[i].cells[c]);
    free(g->rows[i].cells);
  }
  free(g->rows);
}

static const char *cell_at(const CsvRow *row, int i) {
  if (!row || i < 0 || i >= row->n) return "";
  return row->cells[i];
}

typedef struct {
  char *label;
  char **cells;
  int n, cap;
} Field;

static Field *field_get(Field *f, int n, const char *label) {
  for (int i = 0; i < n; i++)
    if (!strcmp(f[i].label, label)) return &f[i];
  return NULL;
}

static void field_set(Field *f, const char *value) {
  if (f->n == f->cap) {
    f->cap = f->cap ? f->cap * 2 : 4;
    f->cells = realloc(f->cells, (size_t)f->cap * sizeof(char *));
    if (!f->cells) die_mem();
  }
  f->cells[f->n++] = strdup(value);
}

static void free_fields(Field *f, int n) {
  for (int i = 0; i < n; i++) {
    free(f[i].label);
    for (int c = 0; c < f[i].n; c++) free(f[i].cells[c]);
    free(f[i].cells);
  }
  free(f);
}

static const char *field_cell(Field *fields, int nfields, const char *label, int index) {
  Field *f = field_get(fields, nfields, label);
  if (!f || index < 0 || index >= f->n) return "";
  return f->cells[index];
}

static int trim_copy_nonempty(const char *bit) {
  while (*bit && isspace((unsigned char)*bit)) bit++;
  return *bit != 0;
}

static int clock_range(const char *text, int *hour, int *minute) {
  if (!text) return 0;
  for (const char *p = text; *p; p++) {
    if (!isdigit((unsigned char)*p)) continue;
    int h1 = 0, m1 = 0, h2 = 0, m2 = 0;
    const char *q = p;
    while (isdigit((unsigned char)*q)) h1 = h1 * 10 + (*q++ - '0');
    if (*q == ':') {
      q++;
      if (!isdigit((unsigned char)q[0]) || !isdigit((unsigned char)q[1])) continue;
      m1 = (q[0] - '0') * 10 + (q[1] - '0');
      q += 2;
    }
    if (*q == '-' || ((unsigned char)q[0] == 0xE2 && (unsigned char)q[1] == 0x80 && (unsigned char)q[2] == 0x93)) {
      if ((unsigned char)*q == 0xE2) q += 2;
    } else continue;
    q++;
    if (!isdigit((unsigned char)*q)) continue;
    while (isdigit((unsigned char)*q)) h2 = h2 * 10 + (*q++ - '0');
    if (*q == ':') {
      q++;
      if (!isdigit((unsigned char)q[0]) || !isdigit((unsigned char)q[1])) continue;
      m2 = (q[0] - '0') * 10 + (q[1] - '0');
      q += 2;
    }
    while (*q == ' ') q++;
    int pm = 0, am = 0;
    if (tolower((unsigned char)*q) == 'a' || tolower((unsigned char)*q) == 'p') {
      pm = tolower((unsigned char)*q) == 'p';
      am = !pm;
    }
    if (!am && !pm) continue;
    if (pm && h1 < 12) h1 += 12;
    if (am && h1 == 12) h1 = 0;
    (void)h2;
    (void)m2;
    if (h1 > 23 || m1 > 59) continue;
    *hour = h1;
    *minute = m1;
    return 1;
  }
  return clock_ampm(text, hour, minute);
}

static int weekday_number(const char *name) {
  for (int i = 1; i <= 7; i++)
    if (contains_ci(name, WEEKDAYS[i])) return i;
  return 0;
}

static void from_sheet(Grid *g, const char *program, Rows *out) {
  if (!g->n) return;
  const char *header = cell_at(&g->rows[0], 0);
  char header_buf[120];
  put(header_buf, sizeof header_buf, header);
  trim(header_buf);
  int days[8], nd = 0;
  if (contains_ci(header_buf, "every day")) {
    for (int d = 1; d <= 7; d++) days[nd++] = d;
  } else if (contains_ci(header_buf, "weekday")) {
    for (int d = 1; d <= 5; d++) days[nd++] = d;
  } else {
    int d = weekday_number(header_buf);
    if (d) days[nd++] = d;
  }
  if (!nd) return;
  Field *fields = NULL;
  int nf = 0, fcap = 0;
  Field *current = NULL;
  for (int r = 0; r < g->n; r++) {
    char label[160];
    put(label, sizeof label, cell_at(&g->rows[r], 0));
    trim(label);
    if (label[0]) {
      if (nf == fcap) {
        fcap = fcap ? fcap * 2 : 8;
        fields = realloc(fields, (size_t)fcap * sizeof(Field));
        if (!fields) die_mem();
      }
      memset(&fields[nf], 0, sizeof fields[nf]);
      fields[nf].label = strdup(label);
      current = &fields[nf++];
      for (int c = 1; c < g->rows[r].n; c++) field_set(current, cell_at(&g->rows[r], c));
    } else if (current) {
      for (int c = 1; c < g->rows[r].n; c++) {
        const char *bit = cell_at(&g->rows[r], c);
        if (!trim_copy_nonempty(bit)) continue;
        int index = c - 1;
        while (current->n <= index) field_set(current, "");
        char *joined = malloc(strlen(current->cells[index]) + strlen(bit) + 2);
        if (!joined) die_mem();
        sprintf(joined, "%s\n%s", current->cells[index], bit);
        free(current->cells[index]);
        current->cells[index] = joined;
      }
    }
  }
  Field *times = field_get(fields, nf, header_buf);
  Field *names = field_get(fields, nf, "Group Name");
  int width = times ? times->n : 0;
  if (names && names->n > width) width = names->n;
  for (int i = 0; i < width; i++) {
    const char *name = field_cell(fields, nf, "Group Name", i);
    const char *when = times && i < times->n ? times->cells[i] : "";
    int hour, minute;
    if (!name[0] || !clock_ampm(when, &hour, &minute)) continue;
    const char *notes = field_cell(fields, nf, "Notes", i);
    const char *contact = field_cell(fields, nf, "Group Contact", i);
    const char *language = field_cell(fields, nf, "Language (if not noted, in English)", i);
    if (!language[0]) language = field_cell(fields, nf, "Language", i);
    const char *access = field_cell(fields, nf, "Access Method", i);
    const char *link = field_cell(fields, nf, "Link", i);
    const char *meeting = field_cell(fields, nf, "Meeting ID", i);
    const char *code = field_cell(fields, nf, "Passcode", i);
    if (!code[0]) code = field_cell(fields, nf, "Access Code", i);
    if (!code[0]) code = field_cell(fields, nf, "Phone password", i);
    const char *phone = field_cell(fields, nf, "Phone Number", i);
    if (!phone[0]) phone = field_cell(fields, nf, "Phone #", i);
    const char *interest = field_cell(fields, nf, "Special Interest", i);
    const char *based = field_cell(fields, nf, "Based in", i);
    char blob[2000];
    snprintf(blob, sizeof blob, "%s %s %s %s %s", name, access, notes, interest, when);
    if (teen(blob)) continue;
    Row row;
    row_init(&row, program);
    collapse_spaces(row.name);
    cap_copy(row.name, sizeof row.name, name);
    collapse_spaces(row.name);
    row.hour = hour;
    row.minute = minute;
    char zone[80] = "America/Chicago";
    const char *ztok = NULL;
    const char *keys[] = {"Eastern", "Central", "Mountain", "Pacific", "London", "UK", "GMT", "ET", "CT", "MT", "PT", 0};
    for (int k = 0; keys[k]; k++)
      if (ci_find(when, keys[k])) ztok = keys[k];
    if (ztok) usable_zone(ztok, zone, sizeof zone);
    /* Avoid matching a short token inside a word: ET only as a whole token is already ci_find. */
    if (ci_find(when, "ET") && !ci_find(when, "Eastern")) {
      const char *hit = ci_find(when, "ET");
      if (hit && (hit == when || !isalpha((unsigned char)hit[-1])) && !isalpha((unsigned char)hit[2]))
        usable_zone("ET", zone, sizeof zone);
    }
    put(row.zone, sizeof row.zone, zone);
    char note[1500];
    put(note, sizeof note, notes);
    char lang[80];
    put(lang, sizeof lang, language[0] ? language : "English");
    if (contains_ci(lang, "english")) {
      if (strchr(lang, ',')) {
        char joined[1600];
        snprintf(joined, sizeof joined, "%s\n%s", lang, note);
        cap_copy(note, sizeof note, joined);
      }
      put(lang, sizeof lang, "English");
    }
    put(row.language, sizeof row.language, lang);
    char idbuf[80];
    digits_only(meeting, idbuf, sizeof idbuf, 1);
    char ids[4][16];
    char hunt[600];
    snprintf(hunt, sizeof hunt, "%s %s %s", link, meeting, notes);
    int nz = collect_zoom(hunt, ids, 4);
    char zid[16] = "";
    if (strlen(idbuf) >= 9 && strlen(idbuf) <= 12) put(zid, sizeof zid, idbuf);
    else if (nz == 1) put(zid, sizeof zid, ids[0]);
    human_pw(code, row.password, sizeof row.password);
    if (zid[0]) {
      put(row.platform, sizeof row.platform, "zoom");
      put(row.meeting_id, sizeof row.meeting_id, zid);
      if (!strncmp(link, "http", 4)) put(row.join, sizeof row.join, link);
      else snprintf(row.join, sizeof row.join, "https://zoom.us/j/%s", zid);
      if (row.password[0]) {
        char *q = strchr(row.join, '?');
        if (q) *q = 0;
      }
    } else if (phone[0]) {
      char digs[40];
      digits_only(phone, digs, sizeof digs, 1);
      normalize_phone(digs, based);
      if (strlen(digs) >= 10) {
        put(row.platform, sizeof row.platform, "phone");
        put(row.meeting_id, sizeof row.meeting_id, digs);
        snprintf(row.join, sizeof row.join, "tel:+%s", digs);
      }
    } else {
      const char *at = strchr(contact, '@');
      if (at && (contains_ci(notes, "email") || contains_ci(access, "email") || contains_ci(notes, "contact"))) {
        char email[120];
        const char *s = at;
        while (s > contact && (isalnum((unsigned char)s[-1]) || strchr("._%+-", s[-1]))) s--;
        size_t w = 0;
        while (s[w] && (isalnum((unsigned char)s[w]) || strchr("@._%+-", s[w])) && w + 1 < sizeof email) {
          email[w] = s[w];
          w++;
        }
        email[w] = 0;
        if (strchr(email, '@')) {
          put(row.platform, sizeof row.platform, "email");
          put(row.meeting_id, sizeof row.meeting_id, email);
          snprintf(row.join, sizeof row.join, "mailto:%s", email);
        }
      }
    }
    if (!row.platform[0]) continue;
    int eh = 0, em = 0, sh = 0, sm = 0;
    const char *dash = strstr(when, "-");
    if (!dash) dash = strstr(when, "–");
    if (dash && clock_ampm(when, &sh, &sm) && clock_ampm(dash + 1, &eh, &em)) {
      int mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins <= 0) mins += 12 * 60;
      if (mins >= 15 && mins <= 180) row.duration = mins;
    }
    char full[1700];
    snprintf(full, sizeof full, "%s%s%s%s%s", note, interest[0] ? "\n" : "", interest, access[0] ? "\nAccess: " : "", access[0] ? access : "");
    cap_copy(row.notes, sizeof row.notes, full);
    cap_copy(row.contact, sizeof row.contact, contact);
    cap_copy(row.location, sizeof row.location, based[0] ? based : (row.platform[0] == 'p' ? "Telephone" : "Online"));
    gender_for(blob, row.gender, sizeof row.gender);
    for (int d = 0; d < nd; d++) {
      row.weekday = days[d];
      add_row(out, &row);
    }
  }
  free_fields(fields, nf);
}

static void strip_html(const char *in, char *out, size_t n) {
  size_t w = 0;
  int space = 0;
  for (const char *p = in; *p && w + 1 < n;) {
    if (*p == '<') {
      if (!strncasecmp(p, "<br", 3)) {
        if (w + 1 < n) out[w++] = '\n';
      }
      while (*p && *p != '>') p++;
      if (*p == '>') p++;
      space = 0;
      continue;
    }
    char c = *p++;
    if (c == '\r') continue;
    if (c == '&') {
      if (!strncmp(p, "amp;", 4)) {
        c = '&';
        p += 4;
      } else if (!strncmp(p, "nbsp;", 5)) {
        c = ' ';
        p += 5;
      } else if (!strncmp(p, "lt;", 3)) {
        c = '<';
        p += 3;
      } else if (!strncmp(p, "gt;", 3)) {
        c = '>';
        p += 3;
      }
    }
    if (c == ' ' || c == '\t') {
      if (space) continue;
      space = 1;
      c = ' ';
    } else space = 0;
    out[w++] = c;
  }
  out[w] = 0;
  trim(out);
}

static void from_teamup(cJSON *spec, time_t start, time_t end, Rows *out, char *err, size_t errn) {
  const char *cal = js(spec, "calendar");
  const char *program = js(spec, "program");
  struct tm a, b;
  gmtime_r(&start, &a);
  gmtime_r(&end, &b);
  char url[256];
  snprintf(url, sizeof url, "https://teamup.com/%s/events?startDate=%04d-%02d-%02d&endDate=%04d-%02d-%02d", cal,
           a.tm_year + 1900, a.tm_mon + 1, a.tm_mday, b.tm_year + 1900, b.tm_mon + 1, b.tm_mday);
  char *body = https_get(url, NULL, err, errn);
  if (!body) return;
  cJSON *root = cJSON_Parse(body);
  free(body);
  if (!root) {
    snprintf(err, errn, "Teamup did not return JSON");
    return;
  }
  cJSON *events = cJSON_GetObjectItemCaseSensitive(root, "events");
  if (!cJSON_IsArray(events)) {
    cJSON_Delete(root);
    snprintf(err, errn, "Teamup JSON had no events");
    return;
  }
  typedef struct {
    char series[64];
    char title[160];
    char notes[2000];
    char location[300];
    char tz[80];
    time_t start_at, end_at;
  } Ev;
  int count = cJSON_GetArraySize(events);
  Ev *ev = calloc((size_t)count, sizeof(Ev));
  if (!ev) die_mem();
  int n = 0;
  cJSON *item;
  cJSON_ArrayForEach(item, events) {
    Ev *e = &ev[n];
    put(e->series, sizeof e->series, js(item, "series_id"));
    if (!e->series[0]) put(e->series, sizeof e->series, js(item, "id"));
    char title[300], notes[4000], loc[400];
    strip_html(js(item, "title"), title, sizeof title);
    strip_html(js(item, "notes"), notes, sizeof notes);
    strip_html(js(item, "location"), loc, sizeof loc);
    collapse_spaces(title);
    cap_copy(e->title, sizeof e->title, title);
    cap_copy(e->notes, sizeof e->notes, notes);
    cap_copy(e->location, sizeof e->location, loc);
    put(e->tz, sizeof e->tz, js(item, "tz"));
    if (!parse_iso(js(item, "start_dt"), &e->start_at)) continue;
    if (!parse_iso(js(item, "end_dt"), &e->end_at)) e->end_at = e->start_at + 3600;
    n++;
  }
  int *used = calloc((size_t)n, sizeof(int));
  if (!used) die_mem();
  for (int i = 0; i < n; i++) {
    if (used[i]) continue;
    int best = i;
    size_t bestlen = strlen(ev[i].notes) + strlen(ev[i].location);
    for (int j = i; j < n; j++) {
      if (strcmp(ev[j].series, ev[i].series)) continue;
      used[j] = 1;
      size_t L = strlen(ev[j].notes) + strlen(ev[j].location);
      if (L > bestlen) {
        best = j;
        bestlen = L;
      }
    }
    Ev *base = &ev[best];
    if (teen(base->title)) continue;
    char zone[80];
    if (!usable_zone(base->tz, zone, sizeof zone)) put(zone, sizeof zone, "America/New_York");
    const char *local = ci_find(base->notes, "local time");
    if (local) {
      const char *slash = strchr(local, '/');
      if (slash && slash > local) {
        const char *s = slash;
        while (s > local && (isalnum((unsigned char)s[-1]) || s[-1] == '_')) s--;
        char zname[80];
        size_t w = 0;
        while (s[w] && (isalnum((unsigned char)s[w]) || s[w] == '/' || s[w] == '_' || s[w] == '+' || s[w] == '-') &&
               w + 1 < sizeof zname) {
          zname[w] = s[w];
          w++;
        }
        zname[w] = 0;
        usable_zone(zname, zone, sizeof zone);
      }
    }
    char blob[2500];
    snprintf(blob, sizeof blob, "%s\n%s", base->notes, base->location);
    Row row;
    row_init(&row, program);
    cap_copy(row.name, sizeof row.name, base->title);
    put(row.zone, sizeof row.zone, zone);
    long mins = (long)(base->end_at - base->start_at) / 60;
    if (mins >= 15 && mins <= 240) row.duration = (int)mins;
    apply_place(&row, blob, base->location);
    if (!row.platform[0]) continue;
    cap_copy(row.notes, sizeof row.notes, base->notes);
    cap_copy(row.location, sizeof row.location, row.platform[0] == 'z' ? (contains_ci(blob, "hybrid") ? "Hybrid" : "Online") : "Telephone");
    if (!strcmp(row.platform, "zoom") && contains_ci(blob, "hybrid")) put(row.location, sizeof row.location, "Hybrid");
    gender_for(blob, row.gender, sizeof row.gender);
    int seen_day[8] = {0};
    for (int j = 0; j < n; j++) {
      if (strcmp(ev[j].series, base->series)) continue;
      int wd, h, m;
      if (!wall(zone, ev[j].start_at, &wd, &h, &m)) continue;
      if (j == best || !seen_day[wd]) {
        if (ev[j].start_at == base->start_at || j == best) {
          row.hour = h;
          row.minute = m;
        }
      }
      if (seen_day[wd]) continue;
      seen_day[wd] = 1;
      row.weekday = wd;
      if (j != best) {
        int bh, bm, bwd;
        if (wall(zone, base->start_at, &bwd, &bh, &bm)) {
          row.hour = bh;
          row.minute = bm;
        }
      }
      add_row(out, &row);
    }
  }
  free(used);
  free(ev);
  cJSON_Delete(root);
  err[0] = 0;
}

static void from_gsheets(cJSON *spec, Rows *out, char *err, size_t errn) {
  const char *id = js(spec, "spreadsheet");
  const char *program = js(spec, "program");
  cJSON *gids = cJSON_GetObjectItemCaseSensitive(spec, "gids");
  if (!cJSON_IsArray(gids)) {
    snprintf(err, errn, "sheet source has no tabs");
    return;
  }
  cJSON *gid;
  cJSON_ArrayForEach(gid, gids) {
    if (!cJSON_IsString(gid)) continue;
    char url[400];
    snprintf(url, sizeof url, "https://docs.google.com/spreadsheets/d/%s/export?format=csv&gid=%s", id, gid->valuestring);
    char *body = https_get(url, NULL, err, errn);
    if (!body) return;
    Grid g;
    parse_csv(body, &g);
    free(body);
    from_sheet(&g, program, out);
    free_grid(&g);
  }
  err[0] = 0;
}

static void notes_join(char *dst, size_t n, const char *a, const char *b, const char *c) {
  char buf[4000];
  snprintf(buf, sizeof buf, "%s%s%s%s%s", a && a[0] ? a : "", a && a[0] && ((b && b[0]) || (c && c[0])) ? "\n" : "", b && b[0] ? b : "",
           (b && b[0] && c && c[0]) || (a && a[0] && c && c[0] && !(b && b[0])) ? "\n" : "", c && c[0] ? c : "");
  cap_copy(dst, n, buf);
}

static int daily_skype(const char *blob, const char *contact, const char *program, const char *place, Rows *out) {
  if (!contains_ci(blob, "skype id")) return 0;
  if (!contains_ci(blob, "7 days") && !contains_ci(blob, "seven days") && !contains_ci(blob, "daily")) return 0;
  Row row;
  row_init(&row, program);
  char blob2[4000];
  put(blob2, sizeof blob2, blob);
  apply_place(&row, blob2, place);
  if (strcmp(row.platform, "skype")) return 0;
  int hour = 19, minute = 30;
  clock_ampm(blob, &hour, &minute);
  if (contains_ci(blob, "china")) put(row.zone, sizeof row.zone, "Asia/Shanghai");
  row.hour = hour;
  row.minute = minute;
  row.duration = 60;
  if (contains_ci(blob, "chinese")) {
    put(row.name, sizeof row.name, "Chinese UA Skype");
    put(row.language, sizeof row.language, "Chinese");
  } else put(row.name, sizeof row.name, "Skype meeting");
  cap_copy(row.notes, sizeof row.notes, blob);
  cap_copy(row.contact, sizeof row.contact, contact);
  cap_copy(row.location, sizeof row.location, place && place[0] ? place : "");
  for (int d = 1; d <= 7; d++) {
    row.weekday = d;
    add_row(out, &row);
  }
  return 1;
}

static void from_tsml(cJSON *spec, Rows *out, char *err, size_t errn) {
  const char *page = js(spec, "page");
  const char *program = js(spec, "program");
  if (!page[0]) {
    snprintf(err, errn, "tsml source needs a page");
    return;
  }
  char *html = https_get(page, NULL, err, errn);
  if (!html) return;
  const char *src = strstr(html, "data-src=");
  if (!src) {
    free(html);
    snprintf(err, errn, "page has no meeting-list feed");
    return;
  }
  char quote = src[9];
  src += 10;
  char rel[400];
  size_t w = 0;
  while (src[w] && src[w] != quote && w + 1 < sizeof rel) {
    rel[w] = src[w];
    w++;
  }
  rel[w] = 0;
  char feed[600];
  if (!strncmp(rel, "https://", 8)) snprintf(feed, sizeof feed, "%s", rel);
  else {
    const char *host = page + 8;
    const char *slash = strchr(host, '/');
    size_t hlen = slash ? (size_t)(slash - page) : strlen(page);
    if (hlen + strlen(rel) + 2 >= sizeof feed) {
      free(html);
      snprintf(err, errn, "feed URL is too long");
      return;
    }
    memcpy(feed, page, hlen);
    feed[hlen] = 0;
    if (rel[0] != '/') strcat(feed, "/");
    strcat(feed, rel);
  }
  free(html);
  char *body = https_get(feed, NULL, err, errn);
  if (!body) return;
  cJSON *root = cJSON_Parse(body);
  free(body);
  if (!cJSON_IsArray(root)) {
    cJSON_Delete(root);
    snprintf(err, errn, "meeting list was not a JSON array");
    return;
  }
  cJSON *item;
  cJSON_ArrayForEach(item, root) {
    const char *attendance = js(item, "attendance_option");
    char notes[2200];
    notes_join(notes, sizeof notes, js(item, "notes"), js(item, "location_notes"), "");
    const char *address = js(item, "formatted_address");
    const char *place = address[0] ? address : js(item, "location");
    const char *email = js(item, "email");
    const char *entity = js(item, "entity_email");
    char contact[200];
    contact[0] = 0;
    if (email[0] && !ci_eq(email, entity)) put(contact, sizeof contact, email);
    char blob[3600];
    snprintf(blob, sizeof blob, "%s\n%s\n%s", notes, js(item, "location"), place);
    if (ci_eq(attendance, "inactive")) {
      daily_skype(blob, contact, program, place, out);
      continue;
    }
    if (teen(js(item, "name"))) continue;
    Row row;
    row_init(&row, program);
    cap_copy(row.name, sizeof row.name, js(item, "name"));
    collapse_spaces(row.name);
    int day = jint(item, "day", -1);
    row.weekday = day == 0 ? 7 : day;
    if (!parse_hhmm(js(item, "time"), &row.hour, &row.minute)) continue;
    row.duration = duration_between(js(item, "time"), js(item, "end_time"));
    if (!usable_zone(js(item, "timezone"), row.zone, sizeof row.zone)) {
      if (!guess_zone(place, row.zone, sizeof row.zone)) guess_zone(js(item, "region"), row.zone, sizeof row.zone);
    }
    if (contains_ci(notes, "polish time")) {
      int h, m;
      if (clock_range(notes, &h, &m)) {
        row.hour = h;
        row.minute = m;
        put(row.zone, sizeof row.zone, "Europe/Warsaw");
        row.duration = 60;
      }
    }
    if (contains_ci(notes, "sweden is") || (contains_ci(notes, "in sweden") && contains_ci(notes, "eastern"))) {
      const char *p = ci_find(notes, "sweden");
      int h, m;
      if (p && clock_range(p, &h, &m)) {
        row.hour = h;
        row.minute = m;
        put(row.zone, sizeof row.zone, "Europe/Stockholm");
      }
    }
    char built[2400];
    put(built, sizeof built, notes);
    language_from_types(cJSON_GetObjectItemCaseSensitive(item, "types"), built, row.name, row.language, sizeof row.language, built, sizeof built);
    apply_place(&row, blob, place);
    if (!row.platform[0]) continue;
    cap_copy(row.notes, sizeof row.notes, built[0] ? built : notes);
    cap_copy(row.contact, sizeof row.contact, contact);
    cap_copy(row.location, sizeof row.location, place);
    gender_for(blob, row.gender, sizeof row.gender);
    if (contains_ci(blob, "indonesia") || contains_ci(place, "ubud")) put(row.zone, sizeof row.zone, "Asia/Makassar");
    add_row(out, &row);
  }
  cJSON_Delete(root);
  err[0] = 0;
}

static void dedupe(Rows *rs) {
  int w = 0;
  for (int i = 0; i < rs->n; i++) {
    int dup = 0;
    for (int j = 0; j < w; j++) {
      if (rs->a[i].weekday == rs->a[j].weekday && rs->a[i].hour == rs->a[j].hour && rs->a[i].minute == rs->a[j].minute &&
          ci_eq(rs->a[i].program, rs->a[j].program) && ci_eq(rs->a[i].platform, rs->a[j].platform) &&
          ci_eq(rs->a[i].meeting_id, rs->a[j].meeting_id) && ci_eq(rs->a[i].name, rs->a[j].name)) {
        dup = 1;
        break;
      }
    }
    if (!dup) rs->a[w++] = rs->a[i];
  }
  rs->n = w;
}

static void csv_escape(FILE *f, const char *s) {
  int quote = 0;
  for (const char *p = s; *p; p++)
    if (*p == '"' || *p == ',' || *p == '\n' || *p == '\r') quote = 1;
  if (!quote) {
    fputs(s, f);
    return;
  }
  fputc('"', f);
  for (const char *p = s; *p; p++) {
    if (*p == '"') fputc('"', f);
    fputc(*p, f);
  }
  fputc('"', f);
}

static void write_csv(const char *path, Rows *rs) {
  FILE *f = fopen(path, "wb");
  if (!f) return;
  for (int i = 0; i < 15; i++) {
    if (i) fputc(',', f);
    fputs(HEADERS[i], f);
  }
  fputc('\n', f);
  for (int r = 0; r < rs->n; r++) {
    Row *m = &rs->a[r];
    char timeb[8], dur[8], day[16];
    snprintf(timeb, sizeof timeb, "%02d:%02d", m->hour, m->minute);
    snprintf(dur, sizeof dur, "%d", m->duration);
    put(day, sizeof day, WEEKDAYS[m->weekday]);
    const char *vals[] = {m->name, day, timeb, m->zone, dur, m->platform, m->meeting_id, m->password,
                          m->join, m->notes, m->contact, m->gender, m->program, m->language, m->location};
    for (int c = 0; c < 15; c++) {
      if (c) fputc(',', f);
      csv_escape(f, vals[c]);
    }
    fputc('\n', f);
  }
  fclose(f);
}

static unsigned crc32(const unsigned char *data, size_t n) {
  unsigned crc = 0xFFFFFFFFu;
  for (size_t i = 0; i < n; i++) {
    crc ^= data[i];
    for (int b = 0; b < 8; b++) crc = (crc >> 1) ^ (0xEDB88320u & (0u - (crc & 1u)));
  }
  return ~crc;
}

static void zip_store(FILE *f, const char **names, char **datas, size_t *lens, int n) {
  long offsets[16];
  for (int i = 0; i < n; i++) {
    offsets[i] = ftell(f);
    unsigned crc = crc32((unsigned char *)datas[i], lens[i]);
    unsigned char h[30];
    memset(h, 0, sizeof h);
    h[0] = 0x50;
    h[1] = 0x4b;
    h[2] = 3;
    h[3] = 4;
    h[4] = 20;
    h[6] = 0;
    h[7] = 8; /* utf-8 */
    unsigned sz = (unsigned)lens[i];
    h[14] = crc;
    h[15] = crc >> 8;
    h[16] = crc >> 16;
    h[17] = crc >> 24;
    h[18] = sz;
    h[19] = sz >> 8;
    h[20] = sz >> 16;
    h[21] = sz >> 24;
    h[22] = sz;
    h[23] = sz >> 8;
    h[24] = sz >> 16;
    h[25] = sz >> 24;
    unsigned nlen = (unsigned)strlen(names[i]);
    h[26] = nlen;
    h[27] = nlen >> 8;
    fwrite(h, 1, 30, f);
    fwrite(names[i], 1, nlen, f);
    fwrite(datas[i], 1, lens[i], f);
  }
  long central = ftell(f);
  for (int i = 0; i < n; i++) {
    unsigned crc = crc32((unsigned char *)datas[i], lens[i]);
    unsigned sz = (unsigned)lens[i];
    unsigned nlen = (unsigned)strlen(names[i]);
    unsigned char h[46];
    memset(h, 0, sizeof h);
    h[0] = 0x50;
    h[1] = 0x4b;
    h[2] = 1;
    h[3] = 2;
    h[4] = 20;
    h[6] = 20;
    h[8] = 0;
    h[9] = 8;
    h[16] = crc;
    h[17] = crc >> 8;
    h[18] = crc >> 16;
    h[19] = crc >> 24;
    h[20] = sz;
    h[21] = sz >> 8;
    h[22] = sz >> 16;
    h[23] = sz >> 24;
    h[24] = sz;
    h[25] = sz >> 8;
    h[26] = sz >> 16;
    h[27] = sz >> 24;
    h[28] = nlen;
    h[29] = nlen >> 8;
    unsigned off = (unsigned)offsets[i];
    h[42] = off;
    h[43] = off >> 8;
    h[44] = off >> 16;
    h[45] = off >> 24;
    fwrite(h, 1, 46, f);
    fwrite(names[i], 1, nlen, f);
  }
  long end = ftell(f);
  unsigned char e[22];
  memset(e, 0, sizeof e);
  e[0] = 0x50;
  e[1] = 0x4b;
  e[2] = 5;
  e[3] = 6;
  e[8] = n;
  e[10] = n;
  unsigned csz = (unsigned)(end - central);
  unsigned coff = (unsigned)central;
  e[12] = csz;
  e[13] = csz >> 8;
  e[14] = csz >> 16;
  e[15] = csz >> 24;
  e[16] = coff;
  e[17] = coff >> 8;
  e[18] = coff >> 16;
  e[19] = coff >> 24;
  fwrite(e, 1, 22, f);
}

static char *xml_escape_dup(const char *s) {
  size_t n = 0;
  for (const char *p = s; *p; p++) n += (*p == '<' || *p == '>' || *p == '&') ? 5 : 1;
  char *o = malloc(n + 1);
  if (!o) die_mem();
  char *w = o;
  for (const char *p = s; *p; p++) {
    if (*p == '&') {
      memcpy(w, "&amp;", 5);
      w += 5;
    } else if (*p == '<') {
      memcpy(w, "&lt;", 4);
      w += 4;
    } else if (*p == '>') {
      memcpy(w, "&gt;", 4);
      w += 4;
    } else if ((unsigned char)*p < 32 && *p != '\n' && *p != '\t' && *p != '\r') {
      continue;
    } else *w++ = *p;
  }
  *w = 0;
  return o;
}

static void write_xlsx(const char *path, Rows *rs) {
  size_t cap = 1024 * 1024, len = 0;
  char *sheet = malloc(cap);
  if (!sheet) return;
  int nw = snprintf(sheet, cap,
                    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                    "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>");
  if (nw > 0) len = (size_t)nw;
  for (int r = 0; r <= rs->n; r++) {
    char line[8000];
    size_t lp = 0;
    lp += (size_t)snprintf(line + lp, sizeof line - lp, "<row r=\"%d\">", r + 1);
    for (int c = 0; c < 15; c++) {
      char col = (char)('A' + c);
      const char *val = HEADERS[c];
      char timeb[8], dur[8];
      if (r > 0) {
        Row *m = &rs->a[r - 1];
        snprintf(timeb, sizeof timeb, "%02d:%02d", m->hour, m->minute);
        snprintf(dur, sizeof dur, "%d", m->duration);
        const char *vals[] = {m->name, WEEKDAYS[m->weekday], timeb, m->zone, dur, m->platform, m->meeting_id, m->password,
                              m->join, m->notes, m->contact, m->gender, m->program, m->language, m->location};
        val = vals[c];
      }
      char *esc = xml_escape_dup(val);
      lp += (size_t)snprintf(line + lp, sizeof line - lp, "<c r=\"%c%d\" t=\"inlineStr\"><is><t xml:space=\"preserve\">%s</t></is></c>",
                             col, r + 1, esc);
      free(esc);
      if (lp + 200 >= sizeof line) break;
    }
    snprintf(line + lp, sizeof line - lp, "</row>");
    size_t add = strlen(line);
    if (len + add + 64 > cap) {
      cap = (len + add + 64) * 2;
      char *nb = realloc(sheet, cap);
      if (!nb) {
        free(sheet);
        return;
      }
      sheet = nb;
    }
    memcpy(sheet + len, line, add);
    len += add;
  }
  const char *end = "</sheetData></worksheet>";
  size_t el = strlen(end);
  if (len + el + 1 > cap) {
    sheet = realloc(sheet, len + el + 1);
    if (!sheet) return;
  }
  memcpy(sheet + len, end, el + 1);
  len += el;
  const char *ctypes =
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
      "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">"
      "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>"
      "<Default Extension=\"xml\" ContentType=\"application/xml\"/>"
      "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>"
      "<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>"
      "</Types>";
  const char *rels =
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
      "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
      "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>"
      "</Relationships>";
  const char *wrels =
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
      "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
      "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>"
      "</Relationships>";
  const char *book =
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
      "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" "
      "xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">"
      "<sheets><sheet name=\"Meetings\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>";
  const char *names[] = {"[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/worksheets/sheet1.xml"};
  char *datas[] = {(char *)ctypes, (char *)rels, (char *)book, (char *)wrels, sheet};
  size_t lens[] = {strlen(ctypes), strlen(rels), strlen(book), strlen(wrels), len};
  FILE *f = fopen(path, "wb");
  if (f) {
    zip_store(f, names, datas, lens, 5);
    fclose(f);
  }
  free(sheet);
}

static char *read_whole(const char *path) {
  FILE *f = fopen(path, "rb");
  if (!f) return NULL;
  fseek(f, 0, SEEK_END);
  long n = ftell(f);
  fseek(f, 0, SEEK_SET);
  if (n < 0 || n > 2000000) {
    fclose(f);
    return NULL;
  }
  char *s = malloc((size_t)n + 1);
  if (!s) die_mem();
  if (fread(s, 1, (size_t)n, f) != (size_t)n) {
    free(s);
    fclose(f);
    return NULL;
  }
  fclose(f);
  s[n] = 0;
  return s;
}

static void emit_html(void *ctx, const HtmlMeet *m) {
  Row row;
  memset(&row, 0, sizeof row);
  row.weekday = m->weekday;
  row.hour = m->hour;
  row.minute = m->minute;
  row.duration = m->duration;
  put(row.name, sizeof row.name, m->name);
  put(row.zone, sizeof row.zone, m->zone);
  put(row.platform, sizeof row.platform, m->platform);
  put(row.meeting_id, sizeof row.meeting_id, m->meeting_id);
  put(row.password, sizeof row.password, m->password);
  put(row.join, sizeof row.join, m->join);
  put(row.notes, sizeof row.notes, m->notes);
  put(row.contact, sizeof row.contact, m->contact);
  put(row.gender, sizeof row.gender, m->gender);
  put(row.program, sizeof row.program, m->program);
  put(row.language, sizeof row.language, m->language);
  put(row.location, sizeof row.location, m->location);
  add_row(ctx, &row);
}

static void from_html(cJSON *spec, Rows *out, char *err, size_t errn) {
  const char *parser = js(spec, "parser");
  const char *program = js(spec, "program");
  if (!parser[0]) {
    snprintf(err, errn, "html source needs a parser");
    return;
  }
  if (html_collect(parser, program[0] ? program : parser, spec, emit_html, out, err, errn) != 0 && !err[0])
    snprintf(err, errn, "parse failed");
}

static int parse_file_cmd(int argc, char **argv) {
  if (argc < 4) {
    fprintf(stderr, "usage: assmosis-lists --parse-file PARSER PATH [PATH2] [-o dir]\n");
    return 1;
  }
  const char *parser = argv[2];
  const char *path = argv[3];
  const char *path2 = NULL;
  const char *out_dir = "meeting-updates";
  for (int i = 4; i < argc; i++) {
    if (!strcmp(argv[i], "-o") && i + 1 < argc) out_dir = argv[++i];
    else if (argv[i][0] != '-' && !path2) path2 = argv[i];
    else {
      fprintf(stderr, "Unknown option %s\n", argv[i]);
      return 1;
    }
  }
  const char *program = !strcmp(parser, "ra") ? "recoveries" : parser;
  Rows rows = {0};
  char err[300] = "";
  if (html_parse_path(parser, program, path, path2, emit_html, &rows, err, sizeof err) != 0) {
    fprintf(stderr, "%s\n", err[0] ? err : "parse failed");
    free(rows.a);
    return 1;
  }
  dedupe(&rows);
  if (mkdir(out_dir, 0755) != 0 && errno != EEXIST) {
    fprintf(stderr, "Could not create %s\n", out_dir);
    free(rows.a);
    return 1;
  }
  char opath[512];
  snprintf(opath, sizeof opath, "%s/meetings.csv", out_dir);
  write_csv(opath, &rows);
  printf("%s: %d\nWrote %s\n", parser, rows.n, opath);
  free(rows.a);
  return 0;
}

static void help(void) {
  printf(
      "Assmosis list fetcher\n\n"
      "  assmosis-lists\n"
      "  assmosis-lists ua aca -o meeting-updates\n"
      "  assmosis-lists --list\n"
      "  assmosis-lists --sources sources.json --days 7\n\n"
      "Writes meetings.csv and meetings.xlsx. In Assmosis, open Settings, import the file, and choose Merge.\n"
      "Merge adds rooms you do not already have. It does not delete a room that has left a website.\n\n"
      "A source is a Teamup calendar, a Google Sheet, a 12-step meeting list page (the TSML plugin), or an HTML directory.\n"
      "To add another published list, edit sources.json and run again. Each entry needs kind, program, and label.\n"
      "  teamup:  calendar (the Teamup id)\n"
      "  gsheets: spreadsheet, and gids (the tab ids)\n"
      "  tsml:    page (the meetings page that embeds the list)\n"
      "  html:    parser (arts, ceahow, dda, faa, aba, recoveries, eha, coanon) and page\n"
      "Teen meetings are skipped. A room marked inactive is skipped unless that listing prints a current Skype or call-in.\n"
      "  assmosis-lists --parse-file arts saved.html -o meeting-updates\n");
}

int main(int argc, char **argv) {
  if (argc >= 2 && !strcmp(argv[1], "--self-test")) return self_test();
  if (argc >= 2 && !strcmp(argv[1], "--parse-file")) return parse_file_cmd(argc, argv);
  const char *out_dir = "meeting-updates";
  const char *sources_path = NULL;
  int days = 7, list_only = 0;
  const char *chosen[64];
  int nchosen = 0;
  for (int i = 1; i < argc; i++) {
    if (!strcmp(argv[i], "--help") || !strcmp(argv[i], "-h")) {
      help();
      return 0;
    } else if (!strcmp(argv[i], "--list")) list_only = 1;
    else if (!strcmp(argv[i], "--days") && i + 1 < argc) days = atoi(argv[++i]);
    else if (!strcmp(argv[i], "-o") && i + 1 < argc) out_dir = argv[++i];
    else if (!strcmp(argv[i], "--sources") && i + 1 < argc) sources_path = argv[++i];
    else if (argv[i][0] == '-') {
      fprintf(stderr, "Unknown option %s\n", argv[i]);
      return 1;
    } else if (nchosen < 64) chosen[nchosen++] = argv[i];
  }
  if (days < 1) days = 1;
  char *text = NULL;
  if (sources_path) text = read_whole(sources_path);
  if (!text) text = read_whole("sources.json");
  if (!text) text = read_whole("tools/sources.json");
  int embedded = 0;
  if (!text) {
    text = strdup(EMBEDDED_SOURCES);
    embedded = 1;
  }
  if (!text) die_mem();
  cJSON *root = cJSON_Parse(text);
  if (!root || !cJSON_IsObject(root)) {
    fprintf(stderr, "sources.json is not valid\n");
    free(text);
    return 1;
  }
  if (list_only) {
    cJSON *child;
    cJSON_ArrayForEach(child, root) {
      printf("%-8s %-8s %s\n", child->string, js(child, "kind"), js(child, "label"));
    }
    if (embedded) printf("\nUsing the lists baked into this program. Put a sources.json beside it to add more.\n");
    cJSON_Delete(root);
    free(text);
    return 0;
  }
  time_t now = time(NULL);
  time_t end = now + (time_t)days * 86400;
  Rows rows = {0};
  char report[8000];
  size_t rp = 0;
  struct tm stamp;
  gmtime_r(&now, &stamp);
  rp += (size_t)snprintf(report + rp, sizeof report - rp, "Fetched %04d-%02d-%02d %02d:%02d UTC\n", stamp.tm_year + 1900, stamp.tm_mon + 1,
                         stamp.tm_mday, stamp.tm_hour, stamp.tm_min);
  rp += (size_t)snprintf(report + rp, sizeof report - rp,
                         "Calendars use a %d day window from today.\n"
                         "Import meetings.csv or meetings.xlsx from Settings. Use Merge.\n"
                         "Merge skips a room already saved and a room already in the shipped list.\n"
                         "It does not remove a meeting that has left a website.\n\n",
                         days);
  int ran = 0;
  cJSON *child;
  cJSON_ArrayForEach(child, root) {
    if (nchosen) {
      int want = 0;
      for (int i = 0; i < nchosen; i++)
        if (!strcmp(chosen[i], child->string)) want = 1;
      if (!want) continue;
    }
    ran++;
    const char *kind = js(child, "kind");
    int before = rows.n;
    char err[240] = "";
    if (!strcmp(kind, "teamup")) from_teamup(child, now, end, &rows, err, sizeof err);
    else if (!strcmp(kind, "gsheets")) from_gsheets(child, &rows, err, sizeof err);
    else if (!strcmp(kind, "tsml")) from_tsml(child, &rows, err, sizeof err);
    else if (!strcmp(kind, "html")) from_html(child, &rows, err, sizeof err);
    else snprintf(err, sizeof err, "unknown kind %s", kind);
    if (err[0]) rp += (size_t)snprintf(report + rp, sizeof report - rp, "%s: failed — %s\n", child->string, err);
    else
      rp += (size_t)snprintf(report + rp, sizeof report - rp, "%s: %d meetings — %s\n", child->string, rows.n - before, js(child, "label"));
  }
  if (nchosen && !ran) {
    fprintf(stderr, "None of those sources are in the file.\n");
    cJSON_Delete(root);
    free(text);
    return 1;
  }
  dedupe(&rows);
  rp += (size_t)snprintf(report + rp, sizeof report - rp, "\nTotal after removing duplicates: %d\n", rows.n);
  if (mkdir(out_dir, 0755) != 0 && errno != EEXIST) {
    fprintf(stderr, "Could not create %s\n", out_dir);
    return 1;
  }
  char path[512];
  snprintf(path, sizeof path, "%s/meetings.csv", out_dir);
  write_csv(path, &rows);
  snprintf(path, sizeof path, "%s/meetings.xlsx", out_dir);
  write_xlsx(path, &rows);
  snprintf(path, sizeof path, "%s/report.txt", out_dir);
  FILE *rf = fopen(path, "wb");
  if (rf) {
    fputs(report, rf);
    fclose(rf);
  }
  fputs(report, stdout);
  printf("Wrote %s\n", out_dir);
  cJSON_Delete(root);
  free(text);
  free(rows.a);
  return 0;
}
