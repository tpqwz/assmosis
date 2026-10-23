/* HTML meeting directories for the Assmosis list tool.
   One pass, no regex library. The clock, passcode, phone, and teen rules match
   the Python importer, except a comma is never a passcode and a "PIN:" label
   is stripped. Teen meetings are not emitted. SIA is refused: that site blocks
   a fetch, and this file will not invent rows. */
#include "htmlmeet.h"
#include "https.h"
#include "tz.h"

#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

static const char *CHROME_UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36";

typedef struct {
  char *s;
  size_t n, cap;
} Buf;

static void die_mem(void) {
  fprintf(stderr, "out of memory\n");
  exit(1);
}

static void buf_add(Buf *b, const char *p, size_t n) {
  if (b->n + n + 1 > b->cap) {
    size_t nc = b->cap ? b->cap * 2 : 4096;
    while (b->n + n + 1 > nc) nc *= 2;
    char *ns = realloc(b->s, nc);
    if (!ns) die_mem();
    b->s = ns;
    b->cap = nc;
  }
  if (n) memcpy(b->s + b->n, p, n);
  b->n += n;
  b->s[b->n] = 0;
}

static void buf_putc(Buf *b, char c) { buf_add(b, &c, 1); }

static char *buf_take(Buf *b) {
  if (!b->s) {
    b->s = calloc(1, 1);
    if (!b->s) die_mem();
  }
  char *s = b->s;
  b->s = NULL;
  b->n = b->cap = 0;
  return s;
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

static int ci_starts(const char *s, const char *lit) {
  while (*lit) {
    if (tolower((unsigned char)*s) != tolower((unsigned char)*lit)) return 0;
    s++;
    lit++;
  }
  return 1;
}

static const char *find_ci(const char *hay, const char *needle) {
  if (!hay || !needle || !needle[0]) return NULL;
  size_t n = strlen(needle);
  for (const char *p = hay; *p; p++) {
    size_t i = 0;
    while (i < n && p[i] && tolower((unsigned char)p[i]) == tolower((unsigned char)needle[i])) i++;
    if (i == n) return p;
  }
  return NULL;
}

static const char *find_ci_end(const char *hay, const char *end, const char *needle) {
  size_t n = strlen(needle);
  if (!hay || hay >= end || n == 0) return NULL;
  for (const char *p = hay; p + n <= end; p++) {
    size_t i = 0;
    while (i < n && tolower((unsigned char)p[i]) == tolower((unsigned char)needle[i])) i++;
    if (i == n) return p;
  }
  return NULL;
}

static int word_byte(unsigned char c) { return isalnum(c) || c == '_' || c >= 128; }

static int match_ci_at(const char *p, const char *lit) {
  while (*lit) {
    if (!*p || tolower((unsigned char)*p) != tolower((unsigned char)*lit)) return 0;
    p++;
    lit++;
  }
  return 1;
}

static int bounded_term(const char *s, const char *term) {
  size_t n = strlen(term);
  if (!s) return 0;
  for (const char *p = s; *p; p++) {
    if (!match_ci_at(p, term)) continue;
    int before = p == s || !word_byte((unsigned char)p[-1]);
    int after = !word_byte((unsigned char)p[n]);
    if (before && after) return 1;
  }
  return 0;
}

static int prefix_term(const char *s, const char *term) {
  size_t n = strlen(term);
  if (!s) return 0;
  for (const char *p = s; *p; p++) {
    if (!match_ci_at(p, term)) continue;
    if (p == s || !word_byte((unsigned char)p[-1])) return 1;
    (void)n;
  }
  return 0;
}

static int utf8_len(unsigned char c) {
  if ((c & 0x80) == 0) return 1;
  if ((c & 0xe0) == 0xc0) return 2;
  if ((c & 0xf0) == 0xe0) return 3;
  if ((c & 0xf8) == 0xf0) return 4;
  return 1;
}

static void emit_cp(Buf *b, unsigned v) {
  if (v == 0xA0) {
    buf_putc(b, ' ');
    return;
  }
  if (v == 0x200B || v == 0) return;
  unsigned char tmp[4];
  int n = 0;
  if (v < 0x80) {
    buf_putc(b, (char)v);
    return;
  }
  if (v < 0x800) {
    tmp[0] = (unsigned char)(0xc0 | (v >> 6));
    tmp[1] = (unsigned char)(0x80 | (v & 0x3f));
    n = 2;
  } else if (v < 0x10000) {
    tmp[0] = (unsigned char)(0xe0 | (v >> 12));
    tmp[1] = (unsigned char)(0x80 | ((v >> 6) & 0x3f));
    tmp[2] = (unsigned char)(0x80 | (v & 0x3f));
    n = 3;
  } else {
    tmp[0] = (unsigned char)(0xf0 | (v >> 18));
    tmp[1] = (unsigned char)(0x80 | ((v >> 12) & 0x3f));
    tmp[2] = (unsigned char)(0x80 | ((v >> 6) & 0x3f));
    tmp[3] = (unsigned char)(0x80 | (v & 0x3f));
    n = 4;
  }
  buf_add(b, (char *)tmp, (size_t)n);
}

static int hexval(char c) {
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'a' && c <= 'f') return c - 'a' + 10;
  if (c >= 'A' && c <= 'F') return c - 'A' + 10;
  return -1;
}

static int named_cp(const char *name) {
  struct {
    const char *n;
    int cp;
  } table[] = {
      {"amp", '&'},     {"lt", '<'},      {"gt", '>'},      {"quot", '"'},   {"apos", '\''},
      {"nbsp", 0xA0},   {"ndash", 0x2013}, {"mdash", 0x2014}, {"lsquo", 0x2018}, {"rsquo", 0x2019},
      {"ldquo", 0x201C}, {"rdquo", 0x201D}, {"hellip", 0x2026}, {"eacute", 0xE9}, {"egrave", 0xE8},
      {"aacute", 0xE1}, {"agrave", 0xE0}, {"oacute", 0xF3}, {"uacute", 0xFA}, {"ntilde", 0xF1},
      {"uuml", 0xFC},   {"ouml", 0xF6},   {"auml", 0xE4},   {"ccedil", 0xE7}, {"iacute", 0xED},
      {"szlig", 0xDF},  {"copy", 0xA9},   {0, 0}};
  for (int i = 0; table[i].n; i++)
    if (!strcmp(name, table[i].n)) return table[i].cp;
  return -1;
}

/* Decode one entity at *pp. Returns 1 and advances on success. */
static int take_entity(const char **pp, Buf *b) {
  const char *p = *pp;
  if (*p != '&') return 0;
  if (p[1] == '#') {
    const char *q = p + 2;
    int hex = 0;
    if (*q == 'x' || *q == 'X') {
      hex = 1;
      q++;
    }
    unsigned v = 0;
    int any = 0;
    if (hex) {
      int h;
      while ((h = hexval(*q)) >= 0 && v <= 0x10FFFF) {
        v = (v << 4) + (unsigned)h;
        q++;
        any = 1;
      }
    } else {
      while (isdigit((unsigned char)*q) && v <= 0x10FFFF) {
        v = v * 10 + (unsigned)(*q - '0');
        q++;
        any = 1;
      }
    }
    if (any && *q == ';' && v <= 0x10FFFF) {
      emit_cp(b, v);
      *pp = q + 1;
      return 1;
    }
    return 0;
  }
  if (!isalpha((unsigned char)p[1])) return 0;
  char name[24];
  int i = 0;
  const char *q = p + 1;
  while (isalpha((unsigned char)*q) && i < 20) name[i++] = (char)tolower((unsigned char)*q++);
  name[i] = 0;
  if (*q == ';' && i) {
    int cp = named_cp(name);
    if (cp >= 0) {
      emit_cp(b, (unsigned)cp);
      *pp = q + 1;
      return 1;
    }
  }
  return 0;
}

static int tag_name_is(const char *p, const char *name) {
  size_t n = strlen(name);
  if (!ci_starts(p, name)) return 0;
  unsigned char c = (unsigned char)p[n];
  return c == '>' || c == '/' || isspace(c);
}

static const char *skip_tag(const char *p, const char *end) {
  int quote = 0;
  for (; p < end; p++) {
    if (quote) {
      if (*p == quote) quote = 0;
      continue;
    }
    if (*p == '"' || *p == '\'') {
      quote = *p;
      continue;
    }
    if (*p == '>') return p + 1;
  }
  return end;
}

static char *cleanup_lines(char *raw) {
  Buf b = {0};
  const unsigned char *p = (const unsigned char *)raw;
  int space = 0, at_line = 1;
  while (*p) {
    if (p[0] == 0xc2 && p[1] == 0xa0) {
      p += 2;
      if (!at_line) space = 1;
      continue;
    }
    if (p[0] == 0xe2 && p[1] == 0x80 && p[2] == 0x8b) {
      p += 3;
      continue;
    }
    if (*p == '\r') {
      p++;
      continue;
    }
    if (*p == '\n') {
      space = 0;
      at_line = 1;
      buf_putc(&b, '\n');
      p++;
      continue;
    }
    if (*p == ' ' || *p == '\t') {
      if (!at_line) space = 1;
      p++;
      continue;
    }
    if (space) buf_putc(&b, ' ');
    space = 0;
    at_line = 0;
    int n = utf8_len(*p);
    for (int i = 0; i < n && p[i]; i++) buf_putc(&b, (char)p[i]);
    p += n;
  }
  free(raw);
  char *s = buf_take(&b);
  size_t n = strlen(s);
  while (n && (s[n - 1] == '\n' || s[n - 1] == ' ')) s[--n] = 0;
  char *a = s;
  while (*a == '\n' || *a == ' ') a++;
  if (a != s) memmove(s, a, strlen(a) + 1);
  return s;
}

/* script/style/svg dropped. noscript kept. Newline on br and those close tags. */
static char *html_text(const char *s, const char *end) {
  Buf b = {0};
  if (!s) s = "";
  if (!end) end = s + strlen(s);
  const char *p = s;
  while (p < end) {
    if (*p == '<') {
      if (p + 4 < end && p[1] == '!' && p[2] == '-' && p[3] == '-') {
        const char *c = find_ci_end(p, end, "-->");
        p = c ? c + 3 : end;
        buf_putc(&b, ' ');
        continue;
      }
      const char *namep = p + 1;
      if (*namep == '/') namep++;
      int skip = 0;
      const char *close = NULL;
      if (tag_name_is(namep, "script")) {
        skip = 1;
        close = "</script";
      } else if (tag_name_is(namep, "style")) {
        skip = 1;
        close = "</style";
      } else if (tag_name_is(namep, "svg")) {
        skip = 1;
        close = "</svg";
      }
      if (skip && p[1] != '/') {
        const char *c = find_ci_end(p, end, close);
        if (c) {
          p = skip_tag(c, end);
          buf_putc(&b, ' ');
          continue;
        }
      }
      if (tag_name_is(p + 1, "br")) {
        p = skip_tag(p, end);
        buf_putc(&b, '\n');
        continue;
      }
      if (p[1] == '/') {
        const char *n = p + 2;
        int nl = tag_name_is(n, "p") || tag_name_is(n, "div") || tag_name_is(n, "li") || tag_name_is(n, "tr") ||
                 tag_name_is(n, "td") || tag_name_is(n, "th");
        if (!nl && (n[0] == 'h' || n[0] == 'H') && n[1] >= '1' && n[1] <= '6') {
          unsigned char c = (unsigned char)n[2];
          nl = c == '>' || isspace(c);
        }
        if (nl) {
          p = skip_tag(p, end);
          buf_putc(&b, '\n');
          continue;
        }
      }
      p = skip_tag(p, end);
      buf_putc(&b, ' ');
      continue;
    }
    if (*p == '&') {
      const char *np = p;
      if (take_entity(&np, &b)) {
        p = np;
        continue;
      }
    }
    buf_putc(&b, *p);
    p++;
  }
  return cleanup_lines(buf_take(&b));
}

static char *html_text_str(const char *s) { return html_text(s, s ? s + strlen(s) : s); }

static void squeeze(char *s) {
  if (!s) return;
  unsigned char *p = (unsigned char *)s;
  char *w = s;
  int sp = 0;
  while (*p) {
    int n = 1;
    int blank = 0;
    if (p[0] == 0xc2 && p[1] == 0xa0) {
      blank = 1;
      n = 2;
    } else if (p[0] == 0xe2 && p[1] == 0x80 && p[2] == 0x8b) {
      n = 3;
      p += 3;
      continue;
    } else if (*p == ' ' || *p == '\t' || *p == '\n' || *p == '\r' || *p == '\f' || *p == '\v') {
      blank = 1;
    } else n = utf8_len(*p);
    if (blank) {
      sp = 1;
      p += n;
      continue;
    }
    if (sp && w != s) *w++ = ' ';
    sp = 0;
    for (int i = 0; i < n && p[i]; i++) *w++ = (char)p[i];
    p += n;
  }
  *w = 0;
  char *a = s;
  while (*a == ' ') a++;
  if (a != s) memmove(s, a, strlen(a) + 1);
}

static void lower_copy(char *dst, size_t n, const char *src) {
  size_t i = 0;
  if (!src) src = "";
  for (; src[i] && i + 1 < n; i++) dst[i] = (char)tolower((unsigned char)src[i]);
  dst[i] = 0;
}

static void copy_cap(char *dst, size_t dstn, const char *src, int max_cp) {
  size_t di = 0;
  int cp = 0;
  const unsigned char *p = (const unsigned char *)(src ? src : "");
  while (*p && cp < max_cp && di + 1 < dstn) {
    int n = utf8_len(*p);
    int ok = 1;
    for (int i = 1; i < n; i++)
      if ((p[i] & 0xc0) != 0x80) ok = 0;
    if (!ok) n = 1;
    if (di + (size_t)n >= dstn) break;
    memcpy(dst + di, p, (size_t)n);
    di += (size_t)n;
    p += n;
    cp++;
  }
  dst[di] = 0;
}

static int parse_hm(const char *p, int *hour, int *minute, const char **end) {
  if (!isdigit((unsigned char)*p)) return 0;
  int h = *p - '0';
  p++;
  if (isdigit((unsigned char)*p)) {
    h = h * 10 + (*p - '0');
    p++;
  }
  int m = 0;
  if (*p == ':' && isdigit((unsigned char)p[1]) && isdigit((unsigned char)p[2])) {
    m = (p[1] - '0') * 10 + (p[2] - '0');
    p += 3;
  }
  *hour = h;
  *minute = m;
  *end = p;
  return 1;
}

static void skip_ws(const char **p) {
  while (**p && isspace((unsigned char)**p)) (*p)++;
}

/* 1 hyphen or en-dash, 2 em-dash, 0 none. */
static int dash_kind(const char *p, int *len, int em_ok) {
  if (*p == '-') {
    *len = 1;
    return 1;
  }
  if ((unsigned char)p[0] == 0xe2 && (unsigned char)p[1] == 0x80) {
    if ((unsigned char)p[2] == 0x93) {
      *len = 3;
      return 1;
    }
    if (em_ok && (unsigned char)p[2] == 0x94) {
      *len = 3;
      return 2;
    }
  }
  return 0;
}

static int parse_mer(const char *p, int *is_pm, const char **end) {
  char c = (char)tolower((unsigned char)*p);
  if (c != 'a' && c != 'p') return 0;
  const char *q = p + 1;
  if (*q == '.') q++;
  if (tolower((unsigned char)*q) != 'm') return 0;
  q++;
  if (*q == '.') q++;
  *is_pm = c == 'p';
  *end = q;
  return 1;
}

/* First number wins. No meridiem on that match means no clock, even if a later time has one.
   "11:00-12:00 PM" is 11:00, not 23:00. */
static int clock_scan(const char *text, int *hour, int *minute) {
  if (!text) return 0;
  for (const char *p = text; *p; p++) {
    if (!isdigit((unsigned char)*p)) continue;
    int h = 0, m = 0, eh = 0, em = 0;
    const char *q = p;
    if (!parse_hm(p, &h, &m, &q)) continue;
    skip_ws(&q);
    int start_pm = -1, pm = 0;
    const char *r = q;
    if (parse_mer(q, &pm, &r)) {
      start_pm = pm;
      q = r;
    }
    int end_pm = -1, ranged = 0;
    const char *s = q;
    skip_ws(&s);
    int dlen = 0, sep = 0;
    if (dash_kind(s, &dlen, 1)) {
      sep = 1;
      s += dlen;
    } else if (tolower((unsigned char)s[0]) == 't' && tolower((unsigned char)s[1]) == 'o') {
      sep = 1;
      s += 2;
    }
    if (sep) {
      const char *t = s;
      skip_ws(&t);
      const char *u = t;
      if (parse_hm(t, &eh, &em, &u)) {
        ranged = 1;
        skip_ws(&u);
        int epm = 0;
        const char *v = u;
        if (parse_mer(u, &epm, &v)) end_pm = epm;
      }
    }
    int meridiem = start_pm;
    if (meridiem < 0 && ranged && end_pm == 1 && eh == 12 && h >= 8 && h <= 11) meridiem = 0;
    else if (meridiem < 0) meridiem = end_pm;
    if (meridiem < 0) return 0;
    if (meridiem == 1 && h != 12) h += 12;
    if (meridiem == 0 && h == 12) h = 0;
    if (h > 23 || m > 59) return 0;
    *hour = h;
    *minute = m;
    return 1;
    (void)ranged;
  }
  return 0;
}

static int duration_of(const char *text, int sh, int sm) {
  if (!text) return 60;
  for (const char *p = text; *p; p++) {
    if (!isdigit((unsigned char)*p)) continue;
    int h, m;
    const char *q;
    if (!parse_hm(p, &h, &m, &q)) continue;
    const char *s = q;
    skip_ws(&s);
    int start_pm = -1, pm = 0;
    const char *r;
    if (parse_mer(s, &pm, &r)) {
      start_pm = pm;
      s = r;
    }
    skip_ws(&s);
    int dlen = 0;
    if (!dash_kind(s, &dlen, 0)) continue;
    s += dlen;
    skip_ws(&s);
    int eh, em;
    const char *u;
    if (!parse_hm(s, &eh, &em, &u)) continue;
    skip_ws(&u);
    int end_pm = -1;
    const char *v;
    if (parse_mer(u, &pm, &v)) end_pm = pm;
    int use = end_pm >= 0 ? end_pm : start_pm;
    char buf[32];
    snprintf(buf, sizeof buf, "%d:%02d %s", eh, em, use < 0 ? "" : use == 1 ? "PM" : "AM");
    int eh2, em2;
    if (!clock_scan(buf, &eh2, &em2)) return 60;
    int minutes = (eh2 * 60 + em2) - (sh * 60 + sm);
    if (minutes <= 0) minutes += 12 * 60;
    return (minutes >= 15 && minutes <= 240) ? minutes : 60;
  }
  return 60;
}

static const struct {
  const char *k;
  const char *z;
} ZONE_KEYS[] = {
    {"south africa standard time (sast)", "Africa/Johannesburg"},
    {"mountain standard time (mst)", "America/Phoenix"},
    {"south africa standard time", "Africa/Johannesburg"},
    {"central european summer time", "Europe/Berlin"},
    {"mountain standard time", "America/Phoenix"},
    {"australian eastern", "Australia/Sydney"},
    {"british summer time", "Europe/London"},
    {"central european time", "Europe/Berlin"},
    {"eastern european", "Europe/Athens"},
    {"central european", "Europe/Berlin"},
    {"mst (arizona)", "America/Phoenix"},
    {"greenwich", "Europe/London"},
    {"et (us)", "America/New_York"},
    {"ct (us)", "America/Chicago"},
    {"pt (us)", "America/Los_Angeles"},
    {"jerusalem", "Asia/Jerusalem"},
    {"eastern", "America/New_York"},
    {"central", "America/Chicago"},
    {"pacific", "America/Los_Angeles"},
    {"mountain", "America/Denver"},
    {"israel", "Asia/Jerusalem"},
    {"london", "Europe/London"},
    {"sast", "Africa/Johannesburg"},
    {"mst", "America/Denver"},
    {"pst", "America/Los_Angeles"},
    {"pdt", "America/Los_Angeles"},
    {"cet", "Europe/Berlin"},
    {"eet", "Europe/Athens"},
    {"aet", "Australia/Sydney"},
    {"gmt", "Europe/London"},
    {"msk", "Europe/Moscow"},
    {"bst", "Europe/London"},
    {"et", "America/New_York"},
    {"ct", "America/Chicago"},
    {"mt", "America/Denver"},
    {"pt", "America/Los_Angeles"},
    {"uk", "Europe/London"},
};

static void zone_for(const char *label, char *dst, size_t n) {
  dst[0] = 0;
  if (!label) return;
  char key[240];
  copy_cap(key, sizeof key, label, 200);
  squeeze(key);
  lower_copy(key, sizeof key, key);
  for (size_t i = 0; i < sizeof ZONE_KEYS / sizeof ZONE_KEYS[0]; i++) {
    if (!strcmp(key, ZONE_KEYS[i].k)) {
      snprintf(dst, n, "%s", ZONE_KEYS[i].z);
      return;
    }
  }
  for (size_t i = 0; i < sizeof ZONE_KEYS / sizeof ZONE_KEYS[0]; i++) {
    if (ZONE_KEYS[i].k[0] && strstr(key, ZONE_KEYS[i].k)) {
      snprintf(dst, n, "%s", ZONE_KEYS[i].z);
      return;
    }
  }
}

static const char *country_cc(const char *country) {
  char key[80];
  copy_cap(key, sizeof key, country ? country : "", 60);
  squeeze(key);
  lower_copy(key, sizeof key, key);
  if (!strcmp(key, "france")) return "33";
  if (!strcmp(key, "germany")) return "49";
  if (!strcmp(key, "israel")) return "972";
  if (!strcmp(key, "ireland")) return "353";
  if (!strcmp(key, "uk") || !strcmp(key, "united kingdom")) return "44";
  return "";
}

static int phone_char(char c) { return isdigit((unsigned char)c) || c == '-' || c == ' ' || c == '(' || c == ')' || c == '.'; }

static int normalize_phone(const char *chunk, const char *cc, char *dst, size_t n) {
  char digits[40];
  size_t d = 0;
  for (const char *p = chunk; *p && d + 1 < sizeof digits; p++)
    if (isdigit((unsigned char)*p)) digits[d++] = *p;
  digits[d] = 0;
  if (d >= 2 && digits[0] == '0' && digits[1] == '0') {
    memmove(digits, digits + 2, d - 1);
    d -= 2;
  }
  char out[40];
  if (d && digits[0] == '0' && cc && cc[0]) snprintf(out, sizeof out, "%s%s", cc, digits + 1);
  else if (d == 9 && cc && !strcmp(cc, "33")) snprintf(out, sizeof out, "33%s", digits);
  else if (d == 10 && digits[0] != '0') snprintf(out, sizeof out, "1%s", digits);
  else snprintf(out, sizeof out, "%s", digits);
  size_t len = strlen(out);
  if (len < 10 || len > 15 || len >= n) return 0;
  snprintf(dst, n, "%s", out);
  return 1;
}

static int phone_digits(const char *value, const char *country, char *dst, size_t n) {
  dst[0] = 0;
  if (!value) return 0;
  const char *cc = country_cc(country);
  int found = 0;
  for (const char *p = value; *p; p++) {
    const char *q = p;
    if (*q == '+') q++;
    if (!isdigit((unsigned char)*q)) continue;
    const char *r = q + 1;
    while (phone_char(*r)) r++;
    const char *last = r;
    while (last > q && !isdigit((unsigned char)last[-1])) last--;
    if (last <= q || (last - 1) - (q + 1) < 6) continue;
    char chunk[80];
    size_t len = (size_t)(last - p);
    if (len >= sizeof chunk) len = sizeof chunk - 1;
    memcpy(chunk, p, len);
    chunk[len] = 0;
    found = 1;
    if (normalize_phone(chunk, cc, dst, n)) return 1;
    p = last - 1;
  }
  if (!found) return normalize_phone(value, cc, dst, n);
  return 0;
}

static int stop_pw(const char *s) {
  static const char *words[] = {"for", "the", "is", "required", "protected", "none", "optional", "link",
                                "not provided", "n/a", "na", "no", "none needed", "no passcode", "nopasscode", 0};
  for (int i = 0; words[i]; i++)
    if (ci_eq(s, words[i])) return 1;
  return 0;
}

static void human_pw(const char *value, char *dst, size_t n) {
  dst[0] = 0;
  if (!value || n < 2) return;
  char buf[160];
  copy_cap(buf, sizeof buf, value, 120);
  squeeze(buf);
  size_t len = strlen(buf);
  while (len && (buf[len - 1] == '.' || buf[len - 1] == '#')) buf[--len] = 0;
  char *a = buf;
  while (*a == '.' || *a == '#') a++;
  if (a != buf) memmove(buf, a, strlen(a) + 1);
  if (ci_starts(buf, "pin:")) {
    memmove(buf, buf + 4, strlen(buf + 4) + 1);
    squeeze(buf);
  }
  int digits = buf[0] != 0, spaced = 0;
  for (char *p = buf; *p; p++) {
    if (*p == ' ') spaced = 1;
    else if (!isdigit((unsigned char)*p)) digits = 0;
  }
  if (digits && spaced) {
    char *w = buf;
    for (char *p = buf; *p; p++)
      if (*p != ' ') *w++ = *p;
    *w = 0;
  }
  len = strlen(buf);
  if (!len || len > 24 || strchr(buf, ',')) return;
  if (bounded_term(buf, "contact") || bounded_term(buf, "email") || bounded_term(buf, "call") || bounded_term(buf, "text"))
    return;
  if (len >= 18) {
    int sym = 1;
    for (size_t i = 0; i < len; i++) {
      unsigned char c = (unsigned char)buf[i];
      if (!isalnum(c) && !strchr("+/_.=-", c)) sym = 0;
    }
    if (sym) return;
  }
  if (stop_pw(buf)) return;
  snprintf(dst, n, "%s", buf);
}

static void gender_for(const char *text, char *dst, size_t n) {
  int men = 0;
  if (text) {
    for (const char *p = text; *p; p++) {
      if (!match_ci_at(p, "men")) continue;
      if (!(p == text || !word_byte((unsigned char)p[-1]))) continue;
      const char *q = p + 3;
      if (*q == '\'') {
        q++;
        if (*q == 's' || *q == 'S') q++;
      } else if ((unsigned char)q[0] == 0xe2 && (unsigned char)q[1] == 0x80 && (unsigned char)q[2] == 0x99) {
        q += 3;
        if (*q == 's' || *q == 'S') q++;
      }
      if (!word_byte((unsigned char)*q)) {
        men = 1;
        break;
      }
    }
  }
  if (prefix_term(text, "women") || bounded_term(text, "female")) snprintf(dst, n, "WOMEN_ONLY");
  else if (men || bounded_term(text, "male")) snprintf(dst, n, "MEN_ONLY");
  else snprintf(dst, n, "ALL");
}

static int teen_text(const char *s) {
  if (!s) return 0;
  return bounded_term(s, "alateen") || bounded_term(s, "narateen") || bounded_term(s, "s-ateen") ||
         bounded_term(s, "sateen") || bounded_term(s, "gam-a-teen") || bounded_term(s, "gamateen") ||
         bounded_term(s, "teen");
}

static int has_cyrillic(const char *s) {
  const unsigned char *p = (const unsigned char *)(s ? s : "");
  while (*p) {
    if ((p[0] == 0xd0 || p[0] == 0xd1) && (p[1] & 0xc0) == 0x80) return 1;
    p += utf8_len(*p);
  }
  return 0;
}

static const struct {
  const char *k;
  const char *v;
} LANGS[] = {{"english", "English"}, {"spanish", "Spanish"}, {"espanol", "Spanish"}, {"español", "Spanish"},
             {"french", "French"},   {"german", "German"},   {"portuguese", "Portuguese"}, {"polish", "Polish"},
             {"russian", "Russian"}, {"hebrew", "Hebrew"},   {"farsi", "Persian"},         {"persian", "Persian"},
             {"italian", "Italian"}, {"dutch", "Dutch"},     {"swedish", "Swedish"},       {"chinese", "Chinese"},
             {"japanese", "Japanese"}, {"arabic", "Arabic"}, {"georgian", "Georgian"},     {0, 0}};

static void title_case(char *s) {
  int up = 1;
  for (unsigned char *p = (unsigned char *)s; *p; p++) {
    if (*p < 128 && isalpha(*p)) {
      *p = (unsigned char)(up ? toupper(*p) : tolower(*p));
      up = 0;
    } else if (*p < 128) up = 1;
  }
}

static void meet_clear(HtmlMeet *m, const char *program) {
  memset(m, 0, sizeof *m);
  m->duration = 60;
  snprintf(m->gender, sizeof m->gender, "ALL");
  snprintf(m->language, sizeof m->language, "English");
  if (program) snprintf(m->program, sizeof m->program, "%s", program);
}

static void finish(HtmlMeet *m, HtmlEmit emit, void *ctx) {
  if (!m || m->weekday < 1 || m->weekday > 7) return;
  squeeze(m->name);
  squeeze(m->meeting_id);
  squeeze(m->password);
  squeeze(m->notes);
  squeeze(m->contact);
  squeeze(m->location);
  squeeze(m->language);
  squeeze(m->join);
  char tmp[1600];
  copy_cap(tmp, sizeof tmp, m->name, 120);
  snprintf(m->name, sizeof m->name, "%s", tmp);
  copy_cap(tmp, sizeof tmp, m->meeting_id, 240);
  snprintf(m->meeting_id, sizeof m->meeting_id, "%s", tmp);
  copy_cap(tmp, sizeof tmp, m->join, 500);
  snprintf(m->join, sizeof m->join, "%s", tmp);
  copy_cap(tmp, sizeof tmp, m->notes, 1500);
  snprintf(m->notes, sizeof m->notes, "%s", tmp);
  copy_cap(tmp, sizeof tmp, m->contact, 240);
  snprintf(m->contact, sizeof m->contact, "%s", tmp);
  copy_cap(tmp, sizeof tmp, m->location, 160);
  snprintf(m->location, sizeof m->location, "%s", tmp);
  if (!m->name[0] || !m->zone[0] || !m->platform[0]) return;
  if (!zone_known(m->zone)) return;
  if (teen_text(m->name) || teen_text(m->notes)) return;
  char pw[40];
  human_pw(m->password, pw, sizeof pw);
  snprintf(m->password, sizeof m->password, "%s", pw);
  if (m->duration <= 0) m->duration = 60;
  if (!m->gender[0]) snprintf(m->gender, sizeof m->gender, "ALL");
  if (!m->language[0]) snprintf(m->language, sizeof m->language, "English");
  emit(ctx, m);
}

static void note_add(char *dst, size_t n, const char *part) {
  if (!part || !part[0] || n < 2) return;
  size_t len = strlen(dst);
  if (len && len + 1 < n) {
    dst[len++] = '\n';
    dst[len] = 0;
  }
  snprintf(dst + len, n - len, "%s", part);
}

static int weekday_name(const char *s) {
  static const char *names[] = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"};
  for (int i = 0; i < 7; i++)
    if (ci_eq(s, names[i])) return i + 1;
  return 0;
}

static int expand_days(const char *raw, int *out, char *note, size_t noten) {
  if (note && noten) note[0] = 0;
  char original[240];
  copy_cap(original, sizeof original, raw ? raw : "", 200);
  squeeze(original);
  char lowered[240];
  lower_copy(lowered, sizeof lowered, original);
  if (note && (strstr(lowered, "1st") || strstr(lowered, "2nd") || strstr(lowered, "3rd") || strstr(lowered, "4th") ||
               strstr(lowered, "first") || strstr(lowered, "second") || strstr(lowered, "third")))
    snprintf(note, noten, "Listed as %s, not every week.", original);
  static const char *full[] = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"};
  char scratch[240];
  snprintf(scratch, sizeof scratch, "%s", lowered);
  int found[8];
  int n = 0;
  for (int i = 0; i < 7; i++) {
    char *at = strstr(scratch, full[i]);
    if (!at) continue;
    found[n++] = i + 1;
    memset(at, ' ', strlen(full[i]));
  }
  static const char *shorts[] = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
                                 "mon",    "tue",     "tues",      "wed",      "thu",     "thur",     "thurs",
                                 "fri",    "sat",     "sun"};
  static const int short_wd[] = {1, 2, 3, 4, 5, 6, 7, 1, 2, 2, 3, 4, 4, 4, 5, 6, 7};
  (void)shorts;
  (void)short_wd;
  const char *tok = scratch;
  while (*tok) {
    while (*tok && !islower((unsigned char)*tok)) tok++;
    if (!*tok) break;
    const char *e = tok;
    while (islower((unsigned char)*e)) e++;
    char token[24];
    size_t len = (size_t)(e - tok);
    if (len < sizeof token) {
      memcpy(token, tok, len);
      token[len] = 0;
      static const char *sh[] = {"mon", "tue", "tues", "wed", "thu", "thur", "thurs", "fri", "sat", "sun"};
      static const int wd[] = {1, 2, 2, 3, 4, 4, 4, 5, 6, 7};
      for (int i = 0; i < 10; i++)
        if (!strcmp(token, sh[i])) {
          int seen = 0;
          for (int j = 0; j < n; j++)
            if (found[j] == wd[i]) seen = 1;
          if (!seen && n < 8) found[n++] = wd[i];
        }
    }
    tok = e;
  }
  for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++)
      if (found[j] < found[i]) {
        int t = found[i];
        found[i] = found[j];
        found[j] = t;
      }
  if (n == 2 && (strchr(lowered, '-') || strstr(lowered, "thru") || strstr(lowered, "through") || strstr(lowered, "to"))) {
    if (found[0] <= found[1]) {
      int a = found[0], b = found[1];
      n = 0;
      for (int d = a; d <= b && n < 8; d++) found[n++] = d;
    }
  }
  for (int i = 0; i < n; i++) out[i] = found[i];
  return n;
}

static void attr_value(const char *tag, const char *end, const char *key, char *dst, size_t n) {
  dst[0] = 0;
  size_t kn = strlen(key);
  for (const char *p = tag; p + kn + 3 < end; p++) {
    if (tolower((unsigned char)*p) != tolower((unsigned char)*key)) continue;
    if (!ci_starts(p, key)) continue;
    if (p > tag && (isalnum((unsigned char)p[-1]) || p[-1] == '-' || p[-1] == '_')) continue;
    const char *q = p + kn;
    if (*q != '=') continue;
    q++;
    char quote = 0;
    if (*q == '"' || *q == '\'') quote = *q++;
    Buf b = {0};
    while (q < end && *q && *q != quote && !(quote == 0 && isspace((unsigned char)*q))) {
      if (*q == '&') {
        const char *np = q;
        if (take_entity(&np, &b) && np <= end) {
          q = np;
          continue;
        }
      }
      buf_putc(&b, *q);
      q++;
    }
    char *s = buf_take(&b);
    snprintf(dst, n, "%s", s);
    free(s);
    return;
  }
}

static int only_digits(const char *s, char *dst, size_t n) {
  size_t d = 0;
  for (const char *p = s; *p && d + 1 < n; p++)
    if (isdigit((unsigned char)*p)) dst[d++] = *p;
  dst[d] = 0;
  return (int)d;
}

static const char *find_zoom(const char *s, char *digits, size_t n) {
  digits[0] = 0;
  const char *p = s;
  while (p && (p = find_ci(p, "zoom.us/j/"))) {
    p += strlen("zoom.us/j/");
    size_t i = 0;
    while (isdigit((unsigned char)p[i]) && i + 1 < n) {
      digits[i] = p[i];
      i++;
    }
    digits[i] = 0;
    if (i >= 9 && i <= 12) return digits;
  }
  return NULL;
}

static void strip_query(char *url) {
  char *q = strchr(url, '?');
  if (q) *q = 0;
}

static void arts_lang(const char *raw, const char *name, char *dst, size_t n) {
  char key[80];
  lower_copy(key, sizeof key, raw ? raw : "");
  squeeze(key);
  for (int i = 0; LANGS[i].k; i++)
    if (!strcmp(key, LANGS[i].k)) {
      snprintf(dst, n, "%s", LANGS[i].v);
      return;
    }
  if (has_cyrillic(name)) {
    snprintf(dst, n, "Russian");
    return;
  }
  if (raw && raw[0] && strlen(raw) >= 2 && strlen(raw) <= 25) {
    int ok = isalpha((unsigned char)raw[0]);
    for (const char *p = raw; ok && *p; p++)
      if (!isalpha((unsigned char)*p) && *p != ' ' && *p != '-') ok = 0;
    if (ok) {
      snprintf(dst, n, "%s", raw);
      title_case(dst);
      return;
    }
  }
  snprintf(dst, n, "English");
}

static void parse_arts(const char *html, const char *program, HtmlEmit emit, void *ctx) {
  const char *p = html;
  while (p && (p = find_ci(p, "<tr"))) {
    if (!tag_name_is(p + 1, "tr")) {
      p += 3;
      continue;
    }
    const char *tr_end = find_ci(p, "</tr>");
    if (!tr_end) break;
    const char *cell_at[12];
    const char *cell_end[12];
    int nc = 0;
    const char *c = p;
    while (nc < 12 && (c = find_ci_end(c, tr_end, "<td"))) {
      if (!tag_name_is(c + 1, "td")) {
        c += 3;
        continue;
      }
      const char *ce = find_ci_end(c, tr_end, "</td>");
      if (!ce) break;
      cell_at[nc] = c;
      cell_end[nc] = ce;
      nc++;
      c = ce + 5;
    }
    p = tr_end + 5;
    if (nc < 9) continue;
    char text[12][300];
    char href[12][500];
    int use = nc > 11 ? 11 : nc;
    for (int i = 0; i < use; i++) {
      char *tx = html_text(cell_at[i], cell_end[i]);
      squeeze(tx);
      snprintf(text[i], sizeof text[i], "%s", tx);
      free(tx);
      href[i][0] = 0;
      const char *h = find_ci_end(cell_at[i], cell_end[i], "href");
      if (h) attr_value(h, cell_end[i], "href", href[i], sizeof href[i]);
    }
    const char *kind = text[0], *day = text[1], *when = text[2], *zone_label = text[3], *language = text[4];
    const char *country = text[5], *name_in = text[6], *theme = text[7], *access = text[8], *code = text[9];
    const char *link = use > 10 ? href[10] : href[9];
    if (!day[0] || ci_starts(kind, "meeting")) continue;
    if ((ci_eq(kind, "steps") || ci_eq(kind, "general topic meetings")) && !when[0]) continue;
    char name[160];
    snprintf(name, sizeof name, "%s", name_in);
    if (!name[0]) {
      if (theme[0] && strlen(theme) > 12) snprintf(name, sizeof name, "%s", theme);
      else if (find_ci(kind, "person") && strpbrk(access, "0123456789")) {
        char street[80];
        copy_cap(street, sizeof street, access, 60);
        snprintf(name, sizeof name, "ARTS, %s", street);
      } else snprintf(name, sizeof name, "ARTS Anonymous");
    }
    int days[8];
    char cadence[200];
    int nd = expand_days(day, days, cadence, sizeof cadence);
    int hour, minute;
    if (!nd || !clock_scan(when, &hour, &minute)) continue;
    char zone[80];
    zone_for(zone_label, zone, sizeof zone);
    if (!zone[0]) continue;
    char blob[800];
    snprintf(blob, sizeof blob, "%s %s %s %s %s %s", kind, name, theme, access, country, language);
    char password[40];
    human_pw(code, password, sizeof password);
    char platform[16] = "", meeting_id[256] = "", join[512] = "";
    char zoom_digits[16];
    char both[800];
    snprintf(both, sizeof both, "%s %s", link, access);
    if (find_ci(kind, "zoom") || find_zoom(both, zoom_digits, sizeof zoom_digits)) {
      char digits[32];
      if (!find_zoom(both, digits, sizeof digits)) only_digits(access, digits, sizeof digits);
      size_t dl = strlen(digits);
      if (dl < 9 || dl > 12) continue;
      snprintf(platform, sizeof platform, "zoom");
      snprintf(meeting_id, sizeof meeting_id, "%s", digits);
      if (ci_starts(link, "http")) snprintf(join, sizeof join, "%s", link);
      else snprintf(join, sizeof join, "https://zoom.us/j/%s", digits);
      if (password[0]) strip_query(join);
    } else if (strchr(access, '@') && !phone_digits(access, country, zoom_digits, sizeof zoom_digits)) {
      char address[200];
      snprintf(address, sizeof address, "%s", access);
      char *sp = strchr(address, ' ');
      if (sp) *sp = 0;
      snprintf(platform, sizeof platform, "email");
      snprintf(meeting_id, sizeof meeting_id, "%s", address);
      snprintf(join, sizeof join, "mailto:%s", address);
    } else if (find_ci(kind, "phone")) {
      char number[32];
      if (!phone_digits(access, country, number, sizeof number)) continue;
      snprintf(platform, sizeof platform, "phone");
      snprintf(meeting_id, sizeof meeting_id, "%s", number);
      snprintf(join, sizeof join, "tel:+%s", number);
    } else if (find_ci(kind, "jitsi")) {
      const char *room = link[0] ? link : access;
      if (!find_ci(room, "meet.jit.si") && !strpbrk(access, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")) continue;
      snprintf(platform, sizeof platform, "jitsi");
      snprintf(meeting_id, sizeof meeting_id, "%s", access[0] ? access : room);
      if (ci_starts(room, "http")) snprintf(join, sizeof join, "%s", room);
    } else if (find_ci(kind, "telegram")) {
      snprintf(platform, sizeof platform, "telegram");
      snprintf(meeting_id, sizeof meeting_id, "%s", link[0] ? link : access);
      if (ci_starts(link, "http")) snprintf(join, sizeof join, "%s", link);
    } else if (find_ci(kind, "meet")) {
      snprintf(platform, sizeof platform, "meet");
      snprintf(meeting_id, sizeof meeting_id, "%s", link[0] ? link : access);
      if (ci_starts(link, "http")) snprintf(join, sizeof join, "%s", link);
    } else if (find_ci(kind, "webex")) {
      snprintf(platform, sizeof platform, "other");
      snprintf(meeting_id, sizeof meeting_id, "%s", link[0] ? link : access);
      if (ci_starts(link, "http")) snprintf(join, sizeof join, "%s", link);
    } else if (find_ci(kind, "person")) {
      if (find_ci(access, "request address") || find_ci(access, "use link") || find_ci(access, "see link")) continue;
      snprintf(platform, sizeof platform, "inperson");
      snprintf(meeting_id, sizeof meeting_id, "%s", access[0] ? access : name);
    } else continue;
    if (!join[0] && (ci_eq(platform, "telegram") || ci_eq(platform, "jitsi") || ci_eq(platform, "meet") || ci_eq(platform, "other")))
      continue;
    char language_name[40];
    arts_lang(language, name, language_name, sizeof language_name);
    int extra_ok = access[0] && strcmp(access, meeting_id) && strcmp(access, code);
    if (extra_ok) {
      const char *at = strchr(access, '@');
      if (at && (at - access) < 3) extra_ok = 0;
    }
    if (extra_ok && ci_eq(platform, "phone") && strlen(access) < 24) {
      char number[32];
      if (phone_digits(access, country, number, sizeof number) && !strcmp(number, meeting_id)) extra_ok = 0;
    }
    char kind_note[200];
    snprintf(kind_note, sizeof kind_note, "%s. %s", kind, country);
    size_t kn = strlen(kind_note);
    while (kn && (kind_note[kn - 1] == '.' || kind_note[kn - 1] == ' ')) kind_note[--kn] = 0;
    char *ks = kind_note;
    while (*ks == '.' || *ks == ' ') ks++;
    char lang_note[80] = "";
    if (language[0] && !find_ci(language, language_name)) snprintf(lang_note, sizeof lang_note, "%s", language);
    char extra_note[300] = "";
    if (extra_ok && !find_ci(name, access)) snprintf(extra_note, sizeof extra_note, "%s", access);
    char gender[16];
    gender_for(blob, gender, sizeof gender);
    int dur = duration_of(when, hour, minute);
    for (int i = 0; i < nd; i++) {
      HtmlMeet m;
      meet_clear(&m, program);
      snprintf(m.name, sizeof m.name, "%s", name);
      m.weekday = days[i];
      m.hour = hour;
      m.minute = minute;
      m.duration = dur;
      snprintf(m.zone, sizeof m.zone, "%s", zone);
      snprintf(m.platform, sizeof m.platform, "%s", platform);
      snprintf(m.meeting_id, sizeof m.meeting_id, "%s", meeting_id);
      snprintf(m.password, sizeof m.password, "%s", code);
      snprintf(m.join, sizeof m.join, "%s", join);
      if (theme[0]) note_add(m.notes, sizeof m.notes, theme);
      if (cadence[0]) note_add(m.notes, sizeof m.notes, cadence);
      if (ks[0]) note_add(m.notes, sizeof m.notes, ks);
      if (lang_note[0]) note_add(m.notes, sizeof m.notes, lang_note);
      if (extra_note[0]) note_add(m.notes, sizeof m.notes, extra_note);
      snprintf(m.gender, sizeof m.gender, "%s", gender);
      snprintf(m.language, sizeof m.language, "%s", language_name);
      snprintf(m.location, sizeof m.location, "%s", ci_eq(platform, "inperson") ? access : country);
      finish(&m, emit, ctx);
    }
  }
}

static const char *span_inner(const char *card, const char *card_end, const char *class_name, const char **inner_end) {
  size_t n = strlen(class_name);
  const char *p = card;
  while (p && (p = find_ci_end(p, card_end, class_name))) {
    char after = (p + n < card_end) ? p[n] : 0;
    int edge = after == '"' || after == '\'' || after == ' ' || after == '>';
    int before = p == card || p[-1] == '"' || p[-1] == '\'' || p[-1] == ' ';
    if (edge && before) {
      const char *gt = memchr(p, '>', (size_t)(card_end - p));
      if (!gt) return NULL;
      const char *close = find_ci_end(gt, card_end, "</span>");
      if (!close) return NULL;
      *inner_end = close;
      return gt + 1;
    }
    p += n;
  }
  return NULL;
}

static int capture_after(const char *plain, const char *label, char *dst, size_t n, int (*ok)(char)) {
  dst[0] = 0;
  const char *p = plain;
  while (p && (p = find_ci(p, label))) {
    const char *q = p + strlen(label);
    while (*q && isspace((unsigned char)*q)) q++;
    if (!*q || !ok(*q)) {
      p += strlen(label);
      continue;
    }
    size_t i = 0;
    while (q[i] && ok(q[i]) && i + 1 < n) {
      dst[i] = q[i];
      i++;
    }
    dst[i] = 0;
    if (i) return 1;
    p += strlen(label);
  }
  return 0;
}

static int ok_phone_body(char c) { return isdigit((unsigned char)c) || c == '-' || c == ' ' || c == '(' || c == ')' || c == '.'; }
static int ok_code_body(char c) { return isalnum((unsigned char)c) || c == '#'; }
static int ok_id_body(char c) { return isdigit((unsigned char)c) || c == ' '; }
static int capture_meeting_id(const char *plain, char *digits, size_t n) {
  digits[0] = 0;
  const char *p = plain;
  while (p && (p = find_ci(p, "Meeting ID"))) {
    const char *q = p + strlen("Meeting ID");
    if (!isspace((unsigned char)*q)) {
      p += 10;
      continue;
    }
    while (isspace((unsigned char)*q)) q++;
    if (!isdigit((unsigned char)*q)) {
      p += 10;
      continue;
    }
    const char *e = q;
    while (*e && (isdigit((unsigned char)*e) || *e == ' ')) e++;
    while (e > q && e[-1] == ' ') e--;
    size_t len = (size_t)(e - q);
    if (len >= 10 && len <= 18 && isdigit((unsigned char)e[-1]) && len - 2 >= 8 && len - 2 <= 16) {
      char raw[24];
      size_t c = len < sizeof raw - 1 ? len : sizeof raw - 1;
      memcpy(raw, q, c);
      raw[c] = 0;
      only_digits(raw, digits, n);
      if (strlen(digits) >= 9 && strlen(digits) <= 12) return 1;
      digits[0] = 0;
    }
    p += 10;
  }
  return 0;
}

static void parse_ceahow(const char *html, const char *program, HtmlEmit emit, void *ctx) {
  const char *p = html;
  while (p && (p = find_ci(p, "<div class=\"mtg-card"))) {
    const char *next = find_ci(p + 10, "<div class=\"mtg-card");
    const char *h2 = find_ci(p + 10, "<h2");
    const char *end = html + strlen(html);
    if (next && (!h2 || next < h2)) end = next;
    else if (h2) end = h2;
    char ident[32], fmt[40], address[300];
    attr_value(p, end, "data-id", ident, sizeof ident);
    attr_value(p, end, "data-format", fmt, sizeof fmt);
    attr_value(p, end, "data-address", address, sizeof address);
    const char *ie = NULL;
    const char *name_s = span_inner(p, end, "mtg-row-name-text", &ie);
    const char *time_s = span_inner(p, end, "mtg-row-time", &ie);
    if (!ident[0] || !name_s || !time_s) {
      p += 10;
      continue;
    }
    const char *name_e = NULL;
    name_s = span_inner(p, end, "mtg-row-name-text", &name_e);
    const char *time_e = NULL;
    time_s = span_inner(p, end, "mtg-row-time", &time_e);
    char *name = html_text(name_s, name_e);
    char *when = html_text(time_s, time_e);
    squeeze(name);
    squeeze(when);
    char *plain = html_text(p, end);
    int hour, minute;
    const char *dayp = NULL;
    static const char *days[] = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
    static const int dayn[] = {7, 1, 2, 3, 4, 5, 6};
    int weekday = 0;
    for (int i = 0; i < 7; i++)
      if ((dayp = find_ci(when, days[i]))) {
        weekday = dayn[i];
        break;
      }
    char zone[80];
    const char *tz_e = NULL;
    const char *tz_s = span_inner(p, end, "tz-label", &tz_e);
    if (tz_s) {
      char *tz = html_text(tz_s, tz_e);
      squeeze(tz);
      zone_for(tz, zone, sizeof zone);
      free(tz);
    } else zone_for("Eastern", zone, sizeof zone);
    if (!clock_scan(when, &hour, &minute) || !weekday || !zone[0]) {
      free(name);
      free(when);
      free(plain);
      p = end;
      continue;
    }
    char digits[20] = "";
    capture_meeting_id(plain, digits, sizeof digits);
    char phonebuf[48] = "", codebuf[24] = "", number[32] = "";
    capture_after(plain, "Phone", phonebuf, sizeof phonebuf, ok_phone_body);
    phone_digits(phonebuf, "", number, sizeof number);
    if (!capture_after(plain, "Access Code", codebuf, sizeof codebuf, ok_code_body))
      capture_after(plain, "Passcode", codebuf, sizeof codebuf, ok_code_body);
    char jitsi_join[200] = "", jitsi_id[80] = "";
    const char *jp = p;
    while ((jp = find_ci_end(jp, end, "meet.jit.si/"))) {
      const char *hs = NULL;
      if (jp >= p + 8 && ci_starts(jp - 8, "https://")) hs = jp - 8;
      else if (jp >= p + 7 && ci_starts(jp - 7, "http://")) hs = jp - 7;
      if (!hs) {
        jp += 12;
        continue;
      }
      const char *room = jp + strlen("meet.jit.si/");
      size_t i = 0;
      while (room < end && i + 1 < sizeof jitsi_id && (isalnum((unsigned char)*room) || *room == '_' || *room == '-'))
        jitsi_id[i++] = *room++;
      jitsi_id[i] = 0;
      if (!jitsi_id[0]) {
        jp += 12;
        continue;
      }
      size_t jl = 0;
      while (hs < end && jl + 1 < sizeof jitsi_join && hs < room) jitsi_join[jl++] = *hs++;
      jitsi_join[jl] = 0;
      break;
    }
    char zoom_href[400] = "";
    const char *zh = p;
    while ((zh = find_ci_end(zh, end, "zoom.us/j/"))) {
      const char *hs = zh;
      while (hs > p && hs[-1] != '"' && hs[-1] != '\'' && (size_t)(zh - hs) < 80) hs--;
      if (ci_starts(hs, "http")) {
        size_t i = 0;
        while (hs < end && i + 1 < sizeof zoom_href && *hs && *hs != '"' && *hs != '\'' && *hs != '<' && !isspace((unsigned char)*hs))
          zoom_href[i++] = *hs++;
        zoom_href[i] = 0;
        break;
      }
      zh += 8;
    }
    char *group = NULL;
    const char *ge = NULL;
    const char *gs = span_inner(p, end, "mtg-row-group", &ge);
    if (gs) {
      group = html_text(gs, ge);
      squeeze(group);
    }
    char *region = NULL;
    const char *re = NULL;
    const char *rs = span_inner(p, end, "mtg-row-region", &re);
    if (rs) {
      region = html_text(rs, re);
      squeeze(region);
      if (ci_eq(region, "non-geographic")) region[0] = 0;
    }
    squeeze(address);
    const char *location = address[0] ? address : (region ? region : "");
    char platform[16] = "", meeting_id[256] = "", join[512] = "";
    char password[40];
    human_pw(codebuf, password, sizeof password);
    if (strlen(digits) >= 9 && strlen(digits) <= 12) {
      snprintf(platform, sizeof platform, "zoom");
      snprintf(meeting_id, sizeof meeting_id, "%s", digits);
      if (zoom_href[0]) snprintf(join, sizeof join, "%s", zoom_href);
      else snprintf(join, sizeof join, "https://zoom.us/j/%s", digits);
      if (password[0]) strip_query(join);
    } else if (jitsi_id[0]) {
      snprintf(platform, sizeof platform, "jitsi");
      snprintf(meeting_id, sizeof meeting_id, "%s", jitsi_id);
      snprintf(join, sizeof join, "%s", jitsi_join);
    } else if (number[0]) {
      snprintf(platform, sizeof platform, "phone");
      snprintf(meeting_id, sizeof meeting_id, "%s", number);
      snprintf(join, sizeof join, "tel:+%s", number);
    } else if ((ci_eq(fmt, "in-person") || ci_eq(fmt, "hybrid")) && address[0]) {
      snprintf(platform, sizeof platform, "inperson");
      snprintf(meeting_id, sizeof meeting_id, "%s", address);
    }
    if (platform[0]) {
      HtmlMeet m;
      meet_clear(&m, program);
      snprintf(m.name, sizeof m.name, "%s", name);
      m.weekday = weekday;
      m.hour = hour;
      m.minute = minute;
      m.duration = 60;
      snprintf(m.zone, sizeof m.zone, "%s", zone);
      snprintf(m.platform, sizeof m.platform, "%s", platform);
      snprintf(m.meeting_id, sizeof m.meeting_id, "%s", meeting_id);
      snprintf(m.password, sizeof m.password, "%s", codebuf);
      snprintf(m.join, sizeof m.join, "%s", join);
      if (group && group[0]) note_add(m.notes, sizeof m.notes, group);
      const char *np = find_ci(plain, "Notes");
      if (np) {
        np += 5;
        while (*np && isspace((unsigned char)*np)) np++;
        char extra[420];
        size_t i = 0;
        while (np[i] && i + 1 < 400) {
          extra[i] = np[i];
          i++;
        }
        extra[i] = 0;
        squeeze(extra);
        if (extra[0]) note_add(m.notes, sizeof m.notes, extra);
      }
      gender_for(plain, m.gender, sizeof m.gender);
      if (find_ci_end(p, end, "mc-badge-lang-es")) snprintf(m.language, sizeof m.language, "Spanish");
      snprintf(m.location, sizeof m.location, "%s", location);
      finish(&m, emit, ctx);
    }
    free(name);
    free(when);
    free(plain);
    free(group);
    free(region);
    p = end;
  }
}

static char *digits_only(const char *s) {
  Buf b = {0};
  for (const char *p = s; *p; p++)
    if (isdigit((unsigned char)*p)) buf_putc(&b, *p);
  return buf_take(&b);
}

static void parse_dda_oregon(const char *html, const char *program, HtmlEmit emit, void *ctx) {
  char *text = html_text_str(html);
  char *squashed = digits_only(text);
  if (!strstr(squashed, "84935395086")) {
    free(text);
    free(squashed);
    return;
  }
  int cancel_fri = find_ci(text, "no meeting friday at 10") != NULL;
  static const struct {
    int wd, hour, minute;
    const char *marker, *name;
  } oregon[] = {
      {7, 10, 0, "SUNDAY-10AM", "Dual Diagnosis Anonymous"},
      {7, 17, 0, "SUNDAY- 5 to 6PM", "Dual Diagnosis Anonymous"},
      {1, 10, 0, "MONDAY-10 to 11", "Dual Diagnosis Anonymous"},
      {1, 17, 0, "MONDAY- 5to 6 PM", "Dual Diagnosis Anonymous"},
      {2, 10, 0, "TUESDAY-10 to 11", "Dual Diagnosis Anonymous"},
      {2, 17, 0, "TUESDAY- 5 to 6 PM", "Dual Diagnosis Anonymous"},
      {3, 10, 0, "WEDNESDAY- 10 to 11", "Dual Diagnosis Anonymous"},
      {3, 17, 0, "Wednesdays- 5pm to 6PM", "Dual Diagnosis Anonymous"},
      {4, 10, 0, "Book Study Meeting THURSDAY- 10 to 11", "DDA book study"},
      {4, 12, 0, "THURSDAY- 12pm to 1pm", "DDA women's meeting"},
      {4, 17, 0, "THURSDAY- 5 to 6 PM", "Dual Diagnosis Anonymous"},
      {5, 10, 0, "FRIDAY- 10 to 11", "Dual Diagnosis Anonymous"},
      {5, 17, 0, "FRIDAY-5 to 6 pm", "Dual Diagnosis Anonymous"},
      {6, 10, 0, "SATURDAY-10 to 11am", "Dual Diagnosis Anonymous"},
      {6, 17, 0, "SATURDAY- 5 to 6 PM", "Dual Diagnosis Anonymous"},
  };
  const char *note =
      "Online meeting on the Dual Diagnosis Anonymous of Oregon list. The page says no passcode is needed. "
      "Times are the Pacific clock printed there. A once-a-month open mic is not listed.";
  for (size_t i = 0; i < sizeof oregon / sizeof oregon[0]; i++) {
    if (!strstr(text, oregon[i].marker)) continue;
    if (oregon[i].wd == 5 && oregon[i].hour == 10 && cancel_fri) continue;
    HtmlMeet m;
    meet_clear(&m, program);
    snprintf(m.name, sizeof m.name, "%s", oregon[i].name);
    m.weekday = oregon[i].wd;
    m.hour = oregon[i].hour;
    m.minute = 0;
    snprintf(m.zone, sizeof m.zone, "America/Los_Angeles");
    snprintf(m.platform, sizeof m.platform, "zoom");
    snprintf(m.meeting_id, sizeof m.meeting_id, "84935395086");
    snprintf(m.join, sizeof m.join, "https://us02web.zoom.us/j/84935395086");
    note_add(m.notes, sizeof m.notes, note);
    gender_for(oregon[i].name, m.gender, sizeof m.gender);
    snprintf(m.location, sizeof m.location, "Online");
    finish(&m, emit, ctx);
  }
  if (strstr(text, "Couple Screws Loose") && strstr(text, "383 232 8581")) {
    HtmlMeet m;
    meet_clear(&m, program);
    snprintf(m.name, sizeof m.name, "Couple Screws Loose");
    m.weekday = 4;
    m.hour = 12;
    m.duration = 90;
    snprintf(m.zone, sizeof m.zone, "America/Los_Angeles");
    snprintf(m.platform, sizeof m.platform, "zoom");
    snprintf(m.meeting_id, sizeof m.meeting_id, "3832328581");
    snprintf(m.join, sizeof m.join, "https://zoom.us/j/3832328581");
    note_add(m.notes, sizeof m.notes,
             "Hybrid meeting in Marysville, Washington. The Oregon page prints Thursday 12:00-1:30 pm and does not name a zone; "
             "stored as Pacific. No street address and no passcode were printed.");
    snprintf(m.location, sizeof m.location, "Marysville, WA");
    finish(&m, emit, ctx);
  }
  if (strstr(text, "Women Only meeting Tuesdays at 8 pm") && strstr(text, "383 232 8581")) {
    HtmlMeet m;
    meet_clear(&m, program);
    snprintf(m.name, sizeof m.name, "DDA women's meeting");
    m.weekday = 2;
    m.hour = 20;
    snprintf(m.zone, sizeof m.zone, "America/Los_Angeles");
    snprintf(m.platform, sizeof m.platform, "zoom");
    snprintf(m.meeting_id, sizeof m.meeting_id, "3832328581");
    snprintf(m.password, sizeof m.password, "DDA");
    snprintf(m.join, sizeof m.join, "https://zoom.us/j/3832328581");
    note_add(m.notes, sizeof m.notes,
             "Marysville, Washington. The Oregon page prints Tuesday 8 pm with passcode DDA and does not name a zone; stored as Pacific.");
    snprintf(m.gender, sizeof m.gender, "WOMEN_ONLY");
    snprintf(m.location, sizeof m.location, "Marysville, WA");
    finish(&m, emit, ctx);
  }
  const char *nc = strstr(text, "North Carolina");
  int on_hold = 0;
  if (nc) {
    char slice[420];
    snprintf(slice, sizeof slice, "%s", nc);
    if (strstr(slice, "Temporarily on hold")) on_hold = 1;
  }
  if (strstr(text, "Sun-Sat at 5pm") && strstr(squashed, "84624074949") && !on_hold) {
    for (int wd = 1; wd <= 7; wd++) {
      HtmlMeet m;
      meet_clear(&m, program);
      snprintf(m.name, sizeof m.name, "DDA North Carolina");
      m.weekday = wd;
      m.hour = 17;
      snprintf(m.zone, sizeof m.zone, "America/Los_Angeles");
      snprintf(m.platform, sizeof m.platform, "zoom");
      snprintf(m.meeting_id, sizeof m.meeting_id, "84624074949");
      snprintf(m.join, sizeof m.join, "https://us06web.zoom.us/j/84624074949?pwd=cENleUdrMzNvQ00zNThBSFFZZXlCdz09");
      note_add(m.notes, sizeof m.notes,
               "The Oregon page says Sunday through Saturday at 5 pm Pacific. The Zoom link keeps the token from that page. "
               "Questions: budman@ddanc.org.");
      snprintf(m.contact, sizeof m.contact, "budman@ddanc.org");
      snprintf(m.location, sizeof m.location, "North Carolina");
      finish(&m, emit, ctx);
    }
  }
  if (strstr(text, "Tuesdays at 3pm") && strstr(squashed, "86391701942")) {
    HtmlMeet m;
    meet_clear(&m, program);
    snprintf(m.name, sizeof m.name, "DDA New Jersey");
    m.weekday = 2;
    m.hour = 15;
    snprintf(m.zone, sizeof m.zone, "America/Los_Angeles");
    snprintf(m.platform, sizeof m.platform, "zoom");
    snprintf(m.meeting_id, sizeof m.meeting_id, "86391701942");
    snprintf(m.join, sizeof m.join, "https://us06web.zoom.us/j/86391701942?pwd=4P1lkHaLiuKTnmWibLLK2aXtHUlh7g.1");
    note_add(m.notes, sizeof m.notes, "The Oregon page says Tuesday at 3 pm Pacific. The Zoom link keeps the token from that page.");
    snprintf(m.location, sizeof m.location, "New Jersey");
    finish(&m, emit, ctx);
  }
  free(text);
  free(squashed);
}

static void percent_decode(char *s) {
  char *w = s;
  for (char *p = s; *p; p++) {
    if (*p == '%' && hexval(p[1]) >= 0 && hexval(p[2]) >= 0) {
      *w++ = (char)(hexval(p[1]) * 16 + hexval(p[2]));
      p += 2;
    } else *w++ = *p;
  }
  *w = 0;
}

static int skip_zoom_id(const char *id) {
  return !strcmp(id, "84935395086") || !strcmp(id, "84624074949") || !strcmp(id, "89948153184") || !strcmp(id, "3832328581");
}

static void parse_dda_uk(const char *html, const char *program, HtmlEmit emit, void *ctx) {
  const char *p = html;
  int first = 1;
  while (p && *p) {
    const char *h = find_ci(p, "<h3");
    if (!h) break;
    if (!tag_name_is(h + 1, "h3")) {
      p = h + 3;
      continue;
    }
    const char *body = skip_tag(h, h + strlen(h));
    const char *next = find_ci(body, "<h3");
    const char *end = next ? next : body + strlen(body);
    if (first) {
      first = 0;
    }
    char *plain_raw = html_text(body, end);
    char plain[4000];
    snprintf(plain, sizeof plain, "%s", plain_raw);
    free(plain_raw);
    squeeze(plain);
    char title[400];
    snprintf(title, sizeof title, "%s", plain);
    char *at = strstr(title, " at:");
    if (at) *at = 0;
    squeeze(title);
    if (!find_ci(title, "meeting") && !find_ci(title, "hope")) {
      p = end;
      continue;
    }
    const char *g = plain;
    int hour = -1, minute = 0;
    const char *gmt_at = NULL;
    size_t gmt_len = 0;
    while (*g) {
      if (isdigit((unsigned char)*g)) {
        int hh, mm;
        const char *e;
        if (parse_hm(g, &hh, &mm, &e)) {
          const char *s = e;
          skip_ws(&s);
          if (ci_starts(s, "hours")) {
            s += 5;
            skip_ws(&s);
            if (ci_starts(s, "(gmt)")) {
              hour = hh;
              minute = mm;
              gmt_at = g;
              gmt_len = (size_t)(s + 5 - g);
              break;
            }
          }
        }
      }
      g++;
    }
    int weekday = 0;
    const char *daylab = find_ci(plain, "Day of Meeting:");
    if (daylab) {
      daylab += strlen("Day of Meeting:");
      while (*daylab && isspace((unsigned char)*daylab)) daylab++;
      char day[20];
      size_t i = 0;
      while (isalpha((unsigned char)daylab[i]) && i + 1 < sizeof day) {
        day[i] = daylab[i];
        i++;
      }
      day[i] = 0;
      weekday = weekday_name(day);
    }
    if (hour < 0 || hour > 23 || minute > 59 || !weekday) {
      p = end;
      continue;
    }
    int th, tm;
    if (clock_scan(title, &th, &tm) && (th != hour || tm != minute)) {
      p = end;
      continue;
    }
    if (find_ci(plain, "on hold") || find_ci(plain, "temporarily")) {
      p = end;
      continue;
    }
    char zid[20] = "", pwd[200] = "";
    const char *z = body;
    while ((z = find_ci_end(z, end, "zoom.us/j/"))) {
      z += strlen("zoom.us/j/");
      size_t i = 0;
      while (isdigit((unsigned char)z[i]) && i + 1 < sizeof zid) {
        zid[i] = z[i];
        i++;
      }
      zid[i] = 0;
      if (ci_starts(z + i, "?pwd=")) {
        size_t k = 0;
        const char *q = z + i;
        while (q < end && *q && *q != '"' && *q != '&' && !isspace((unsigned char)*q) && k + 1 < sizeof pwd) pwd[k++] = *q++;
        pwd[k] = 0;
      }
      break;
    }
    char address[300] = "";
    const char *mp = find_ci_end(body, end, "maps/search/");
    if (mp) {
      mp += strlen("maps/search/");
      size_t i = 0;
      while (mp < end && *mp && *mp != '"' && *mp != '&' && i + 1 < sizeof address) address[i++] = *mp++;
      address[i] = 0;
      percent_decode(address);
      squeeze(address);
    }
    if (zid[0] && skip_zoom_id(zid)) {
      p = end;
      continue;
    }
    char platform[16] = "", meeting_id[256] = "", join[512] = "";
    if (zid[0]) {
      snprintf(platform, sizeof platform, "zoom");
      snprintf(meeting_id, sizeof meeting_id, "%s", zid);
      snprintf(join, sizeof join, "https://zoom.us/j/%s%s", zid, pwd);
    } else if (address[0]) {
      snprintf(platform, sizeof platform, "inperson");
      snprintf(meeting_id, sizeof meeting_id, "%s", address);
    } else {
      p = end;
      continue;
    }
    char name[300];
    snprintf(name, sizeof name, "%s", title);
    static const char *wn[] = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};
    for (int i = 0; i < 7; i++) {
      size_t L = strlen(wn[i]);
      if (ci_starts(name, wn[i]) && isspace((unsigned char)name[L])) {
        char *rest = name + L;
        while (*rest && isspace((unsigned char)*rest)) rest++;
        int hh, mm;
        const char *e = rest;
        if (parse_hm(rest, &hh, &mm, &e)) {
          skip_ws(&e);
          int is_pm, used = 0;
          const char *v = e;
          if (parse_mer(e, &is_pm, &v)) {
            e = v;
            used = 1;
          }
          if (used) {
            while (*e && isspace((unsigned char)*e)) e++;
            rest = (char *)e;
          }
        }
        memmove(name, rest, strlen(rest) + 1);
        break;
      }
    }
    squeeze(name);
    if (!name[0]) snprintf(name, sizeof name, "%s", title);
    HtmlMeet m;
    meet_clear(&m, program);
    snprintf(m.name, sizeof m.name, "%s", name);
    m.weekday = weekday;
    m.hour = hour;
    m.minute = minute;
    snprintf(m.zone, sizeof m.zone, "UTC");
    snprintf(m.platform, sizeof m.platform, "%s", platform);
    snprintf(m.meeting_id, sizeof m.meeting_id, "%s", meeting_id);
    snprintf(m.join, sizeof m.join, "%s", join);
    char gnote[80];
    if (gmt_at && gmt_len < sizeof gnote) {
      memcpy(gnote, gmt_at, gmt_len);
      gnote[gmt_len] = 0;
      squeeze(gnote);
    } else snprintf(gnote, sizeof gnote, "%d:%02d Hours (GMT)", hour, minute);
    char note[240];
    snprintf(note, sizeof note, "Listed by DDA UK at %s. The clock is the GMT hour on that page, not a converted local time.", gnote);
    note_add(m.notes, sizeof m.notes, note);
    gender_for(title, m.gender, sizeof m.gender);
    snprintf(m.location, sizeof m.location, "%s", address[0] ? address : "Online");
    finish(&m, emit, ctx);
    p = end;
  }
}

static int line_list(const char *html, char lines[][512], int maxn) {
  char *text = html_text_str(html);
  int n = 0;
  const char *p = text;
  while (*p && n < maxn) {
    while (*p == '\n') p++;
    if (!*p) break;
    const char *e = strchr(p, '\n');
    if (!e) e = p + strlen(p);
    while (p < e && isspace((unsigned char)*p)) p++;
    const char *t = e;
    while (t > p && isspace((unsigned char)t[-1])) t--;
    size_t len = (size_t)(t - p);
    if (len >= 512) len = 511;
    if (len) {
      memcpy(lines[n], p, len);
      lines[n][len] = 0;
      n++;
    }
    p = *e ? e + 1 : e;
  }
  free(text);
  return n;
}

static void parse_faa(const char *virtual_html, const char *phone_html, const char *program, HtmlEmit emit, void *ctx) {
  char (*lines)[512] = calloc(800, 512);
  if (!lines) die_mem();
  if (virtual_html) {
    int n = line_list(virtual_html, lines, 800);
    int i = 0;
    while (i < n - 4) {
      int wd = weekday_name(lines[i]);
      int hour, minute;
      char digits[20];
      if (!wd || !clock_scan(lines[i + 1], &hour, &minute) || only_digits(lines[i + 2], digits, sizeof digits) < 9 ||
          strlen(digits) > 12) {
        i++;
        continue;
      }
      if (weekday_name(lines[i + 4]) || strlen(lines[i + 4]) < 3) {
        i++;
        continue;
      }
      char notes[4][512];
      int nn = 0;
      int j = i + 5;
      while (j < n && !weekday_name(lines[j])) {
        if (!find_ci(lines[j], "protected email") && !ci_eq(lines[j], "CONTACT INFO:") && nn < 4)
          snprintf(notes[nn++], sizeof notes[0], "%s", lines[j]);
        j++;
      }
      char zone[80];
      zone_for(lines[i + 1], zone, sizeof zone);
      if (!zone[0]) snprintf(zone, sizeof zone, "America/New_York");
      HtmlMeet m;
      meet_clear(&m, program);
      snprintf(m.name, sizeof m.name, "%s", lines[i + 4]);
      m.weekday = wd;
      m.hour = hour;
      m.minute = minute;
      m.duration = duration_of(lines[i + 1], hour, minute);
      snprintf(m.zone, sizeof m.zone, "%s", zone);
      snprintf(m.platform, sizeof m.platform, "zoom");
      snprintf(m.meeting_id, sizeof m.meeting_id, "%s", digits);
      snprintf(m.password, sizeof m.password, "%s", lines[i + 3]);
      snprintf(m.join, sizeof m.join, "https://zoom.us/j/%s", digits);
      for (int k = 0; k < nn; k++) note_add(m.notes, sizeof m.notes, notes[k]);
      note_add(m.notes, sizeof m.notes, "Food Addicts Anonymous virtual intergroup. Passcode is the one printed next to the meeting id.");
      char blob[400];
      snprintf(blob, sizeof blob, "%s %s %s %s", m.name, nn > 0 ? notes[0] : "", nn > 1 ? notes[1] : "", nn > 2 ? notes[2] : "");
      gender_for(blob, m.gender, sizeof m.gender);
      snprintf(m.location, sizeof m.location, "Online");
      finish(&m, emit, ctx);
      i = j;
    }
  }
  if (phone_html) {
    int n = line_list(phone_html, lines, 800);
    int i = 0;
    while (i < n - 4) {
      int wd = weekday_name(lines[i]);
      int hour, minute;
      char number[32];
      if (!wd || !clock_scan(lines[i + 1], &hour, &minute) || !phone_digits(lines[i + 3], "", number, sizeof number)) {
        i++;
        continue;
      }
      if (weekday_name(lines[i + 2])) {
        i++;
        continue;
      }
      const char *topic = lines[i + 2];
      const char *group = "";
      if (i + 5 < n && !weekday_name(lines[i + 5])) group = lines[i + 5];
      HtmlMeet m;
      meet_clear(&m, program);
      snprintf(m.name, sizeof m.name, "%s", topic);
      m.weekday = wd;
      m.hour = hour;
      m.minute = minute;
      m.duration = duration_of(lines[i + 1], hour, minute);
      snprintf(m.zone, sizeof m.zone, "America/New_York");
      snprintf(m.platform, sizeof m.platform, "phone");
      snprintf(m.meeting_id, sizeof m.meeting_id, "%s", number);
      snprintf(m.password, sizeof m.password, "%s", lines[i + 4]);
      snprintf(m.join, sizeof m.join, "tel:+%s", number);
      note_add(m.notes, sizeof m.notes, "Food Addicts Anonymous phone meeting. The page heads this column Time (ET).");
      if (group[0]) {
        char gnote[200];
        snprintf(gnote, sizeof gnote, "Group %s.", group);
        note_add(m.notes, sizeof m.notes, gnote);
      }
      note_add(m.notes, sizeof m.notes, "Dial in, then enter the access code.");
      gender_for(topic, m.gender, sizeof m.gender);
      snprintf(m.location, sizeof m.location, "Phone");
      finish(&m, emit, ctx);
      i = group[0] ? i + 6 : i + 5;
    }
  }
  free(lines);
}

static const char *brace_end(const char *start) {
  int depth = 0;
  int quote = 0;
  for (const char *p = start; *p; p++) {
    if (quote) {
      if (*p == '\\' && p[1]) {
        p++;
        continue;
      }
      if (*p == quote) quote = 0;
      continue;
    }
    if (*p == '"' || *p == '\'') {
      quote = *p;
      continue;
    }
    if (*p == '{') depth++;
    else if (*p == '}') {
      depth--;
      if (depth == 0) return p + 1;
    }
  }
  return NULL;
}

static const char *jstr(cJSON *obj, const char *key) {
  cJSON *item = cJSON_GetObjectItemCaseSensitive(obj, key);
  if (cJSON_IsString(item) && item->valuestring) return item->valuestring;
  return "";
}

static void lang_from_blob(const char *blob, char *dst, size_t n) {
  snprintf(dst, n, "English");
  char low[800];
  copy_cap(low, sizeof low, blob, 700);
  lower_copy(low, sizeof low, low);
  for (int i = 0; LANGS[i].k; i++)
    if (bounded_term(low, LANGS[i].k)) {
      snprintf(dst, n, "%s", LANGS[i].v);
      return;
    }
}

static void parse_aba(const char *html, const char *program, HtmlEmit emit, void *ctx) {
  const char *p = html;
  char seen[64][80];
  int nseen = 0;
  while (p && (p = strstr(p, "\"meetingTimeStart\":\""))) {
    const char *start = p;
    while (start > html && *start != '{') start--;
    if (*start != '{') {
      p += 20;
      continue;
    }
    const char *end = brace_end(start);
    if (!end) {
      p += 20;
      continue;
    }
    size_t len = (size_t)(end - start);
    char *slice = malloc(len + 1);
    if (!slice) die_mem();
    memcpy(slice, start, len);
    slice[len] = 0;
    cJSON *obj = cJSON_Parse(slice);
    free(slice);
    p = end;
    if (!obj) continue;
    const char *title = jstr(obj, "title");
    const char *zone = jstr(obj, "meetingTimeZone");
    const char *ident = jstr(obj, "_id");
    if (!ident[0]) ident = title;
    int dup = 0;
    for (int i = 0; i < nseen; i++)
      if (!strcmp(seen[i], ident)) dup = 1;
    if (dup || !title[0] || !zone[0]) {
      cJSON_Delete(obj);
      continue;
    }
    if (nseen < 64) snprintf(seen[nseen++], 80, "%s", ident);
    if (find_ci(title, "ab-anon") || find_ci(title, "abanon") || find_ci(title, "ab anon") || bounded_term(title, "teen") ||
        find_ci(title, "teen")) {
      /* Python's search is unanchored "teen", so keep the same skip. "teen" above is enough. */
      cJSON_Delete(obj);
      continue;
    }
    const char *status = jstr(obj, "_publishStatus");
    if (status[0] && !ci_eq(status, "PUBLISHED")) {
      cJSON_Delete(obj);
      continue;
    }
    const char *stamp = jstr(obj, "meetingTimeStart");
    int hour = 0, minute = 0;
    const char *hm = stamp;
    if (!parse_hm(hm, &hour, &minute, &hm) || hour > 23 || minute > 59) {
      cJSON_Delete(obj);
      continue;
    }
    int duration = 60;
    const char *endstamp = jstr(obj, "meetingTimeEnd");
    int eh, em;
    const char *ee;
    if (parse_hm(endstamp, &eh, &em, &ee)) {
      int span = (eh * 60 + em) - (hour * 60 + minute);
      if (span <= 0) span += 24 * 60;
      if (span >= 15 && span <= 180) duration = span;
    }
    if (!zone_known(zone)) {
      cJSON_Delete(obj);
      continue;
    }
    char title_c[160];
    snprintf(title_c, sizeof title_c, "%s", title);
    squeeze(title_c);
    if (find_ci(title_c, "ab-anon") || find_ci(title_c, "abanon") || bounded_term(title_c, "teen") || find_ci(title_c, "teen")) {
      cJSON_Delete(obj);
      continue;
    }
    const char *label = jstr(obj, "idOrAdTitle");
    char raw_id[300];
    snprintf(raw_id, sizeof raw_id, "%s", jstr(obj, "meetingIdOrAddress"));
    squeeze(raw_id);
    char link[500];
    snprintf(link, sizeof link, "%s", jstr(obj, "zoomOrMapLink"));
    const char *code_label = jstr(obj, "passOrCityTitle");
    char secret[200];
    snprintf(secret, sizeof secret, "%s", jstr(obj, "passwordOrCityOfOrigin"));
    squeeze(secret);
    if (ci_eq(secret, "not provided") || ci_eq(secret, "none") || ci_eq(secret, "n/a")) secret[0] = 0;
    char password[40];
    if (find_ci(code_label, "code")) human_pw(secret, password, sizeof password);
    else password[0] = 0;
    char secret_note[240] = "";
    if (secret[0] && !password[0] && find_ci(code_label, "code"))
      snprintf(secret_note, sizeof secret_note, "The meeting page does not print a passcode. It says: %s", secret);
    const char *city = find_ci(code_label, "city") ? secret : "";
    char types[240] = "";
    cJSON *type = cJSON_GetObjectItemCaseSensitive(obj, "meetingType");
    if (cJSON_IsArray(type)) {
      cJSON *it;
      cJSON_ArrayForEach(it, type) {
        if (!cJSON_IsString(it) || !it->valuestring) continue;
        if (types[0]) strncat(types, ", ", sizeof types - strlen(types) - 1);
        strncat(types, it->valuestring, sizeof types - strlen(types) - 1);
      }
    } else if (cJSON_IsString(type) && type->valuestring) snprintf(types, sizeof types, "%s", type->valuestring);
    char where[200];
    snprintf(where, sizeof where, "%s", jstr(obj, "meetingLocation"));
    squeeze(where);
    char region[200];
    snprintf(region, sizeof region, "%s", jstr(obj, "meetingRegion"));
    squeeze(region);
    char zdigits[20];
    const char *zoom = find_zoom(link, zdigits, sizeof zdigits);
    char digits[24];
    only_digits(raw_id, digits, sizeof digits);
    const char *address = find_ci(label, "address") ? raw_id : "";
    char platform[16] = "", meeting_id[256] = "", join[512] = "";
    if (zoom || (strlen(digits) >= 9 && strlen(digits) <= 12 && find_ci(label, "zoom"))) {
      snprintf(meeting_id, sizeof meeting_id, "%s", zoom ? zdigits : digits);
      snprintf(platform, sizeof platform, "zoom");
      if (ci_starts(link, "http")) snprintf(join, sizeof join, "%s", link);
      else snprintf(join, sizeof join, "https://zoom.us/j/%s", meeting_id);
      if (password[0]) strip_query(join);
    } else if (address[0] && (find_ci(where, "person") || find_ci(where, "hybrid") || !link[0])) {
      snprintf(platform, sizeof platform, "inperson");
      snprintf(meeting_id, sizeof meeting_id, "%s", address);
    } else {
      cJSON_Delete(obj);
      continue;
    }
    char contact[256] = "";
    const char *bits[] = {jstr(obj, "contactPerson"), jstr(obj, "contactEmailAddress1"), jstr(obj, "contactPhone")};
    for (int i = 0; i < 3; i++) {
      if (!bits[i][0] || ci_eq(bits[i], "not provided")) continue;
      if (contact[0]) strncat(contact, ", ", sizeof contact - strlen(contact) - 1);
      strncat(contact, bits[i], sizeof contact - strlen(contact) - 1);
    }
    char *extra_raw = html_text_str(jstr(obj, "addedInformation"));
    squeeze(extra_raw);
    if (strlen(extra_raw) > 400) extra_raw[400] = 0;
    int hybrid = find_ci(where, "hybrid") || find_ci(types, "hybrid");
    char blob[600];
    snprintf(blob, sizeof blob, "%s %s %s %s", title_c, types, region, extra_raw);
    char language[40];
    lang_from_blob(blob, language, sizeof language);
    char location[180];
    if (address[0]) snprintf(location, sizeof location, "%s", address);
    else if (city[0]) snprintf(location, sizeof location, "%s", city);
    else if (!ci_eq(platform, "zoom")) snprintf(location, sizeof location, "%s", region);
    else location[0] = 0;
    if (ci_eq(platform, "zoom") && !location[0]) snprintf(location, sizeof location, "Online");
    cJSON *days = cJSON_GetObjectItemCaseSensitive(obj, "meetingDays");
    if (cJSON_IsString(days)) {
      cJSON *arr = cJSON_CreateArray();
      cJSON_AddItemToArray(arr, cJSON_CreateString(days->valuestring));
      days = arr;
    }
    if (cJSON_IsArray(days)) {
      cJSON *day;
      cJSON_ArrayForEach(day, days) {
        if (!cJSON_IsString(day) || !day->valuestring) continue;
        char dayname[40];
        snprintf(dayname, sizeof dayname, "%s", day->valuestring);
        squeeze(dayname);
        if (dayname[0]) dayname[0] = (char)toupper((unsigned char)dayname[0]);
        for (char *q = dayname + 1; *q; q++) *q = (char)tolower((unsigned char)*q);
        int wd = weekday_name(dayname);
        if (!wd) continue;
        HtmlMeet m;
        meet_clear(&m, program);
        snprintf(m.name, sizeof m.name, "%s", title_c);
        m.weekday = wd;
        m.hour = hour;
        m.minute = minute;
        m.duration = duration;
        snprintf(m.zone, sizeof m.zone, "%s", zone);
        snprintf(m.platform, sizeof m.platform, "%s", platform);
        snprintf(m.meeting_id, sizeof m.meeting_id, "%s", meeting_id);
        snprintf(m.password, sizeof m.password, "%s", password);
        snprintf(m.join, sizeof m.join, "%s", join);
        if (types[0]) note_add(m.notes, sizeof m.notes, types);
        if (hybrid && ci_eq(platform, "zoom")) note_add(m.notes, sizeof m.notes, "Hybrid.");
        if (region[0]) note_add(m.notes, sizeof m.notes, region);
        if (extra_raw[0]) note_add(m.notes, sizeof m.notes, extra_raw);
        if (secret_note[0]) note_add(m.notes, sizeof m.notes, secret_note);
        note_add(m.notes, sizeof m.notes,
                 "Time and zone are the ones stored on the ABA meeting page, not the clock converted to the visitor's computer.");
        snprintf(m.contact, sizeof m.contact, "%s", contact);
        gender_for(blob, m.gender, sizeof m.gender);
        snprintf(m.language, sizeof m.language, "%s", language);
        snprintf(m.location, sizeof m.location, "%s", location);
        finish(&m, emit, ctx);
      }
    }
    free(extra_raw);
    cJSON_Delete(obj);
  }
}

static void parse_recoveries(const char *html, const char *program, HtmlEmit emit, void *ctx) {
  char *text = html_text_str(html);
  char *squashed = digits_only(text);
  if (strstr(text, "0330 777 2413") && strstr(text, "735 058") && find_ci(text, "women")) {
    for (int i = 0; i < 6; i++) {
      int wd = (int[]){7, 1, 2, 3, 4, 5}[i];
      HtmlMeet m;
      meet_clear(&m, program);
      snprintf(m.name, sizeof m.name, "R.A. phone solution discussion");
      m.weekday = wd;
      m.hour = 9;
      snprintf(m.zone, sizeof m.zone, "Europe/London");
      snprintf(m.platform, sizeof m.platform, "phone");
      snprintf(m.meeting_id, sizeof m.meeting_id, "443307772413");
      snprintf(m.password, sizeof m.password, "735058");
      snprintf(m.join, sizeof m.join, "tel:+443307772413");
      note_add(m.notes, sizeof m.notes,
               "Women's meeting, Sunday through Friday, 9:00 am UK time. US dial-in (978) 990-5000, same access code. "
               "South Africa dial-in on the page uses a different code.");
      snprintf(m.gender, sizeof m.gender, "WOMEN_ONLY");
      snprintf(m.location, sizeof m.location, "Phone");
      finish(&m, emit, ctx);
    }
  }
  if (strstr(squashed, "86823856912") || strstr(text, "868 2385 6912")) {
    if (strstr(text, "8:00 pm in Israel") || strstr(text, "8:00 pm")) {
      HtmlMeet m;
      meet_clear(&m, program);
      snprintf(m.name, sizeof m.name, "R.A. solution discussion");
      m.weekday = 4;
      m.hour = 20;
      snprintf(m.zone, sizeof m.zone, "Asia/Jerusalem");
      snprintf(m.platform, sizeof m.platform, "zoom");
      snprintf(m.meeting_id, sizeof m.meeting_id, "86823856912");
      snprintf(m.password, sizeof m.password, "1234");
      snprintf(m.join, sizeof m.join, "https://us02web.zoom.us/j/86823856912");
      note_add(m.notes, sizeof m.notes, "Thursday. The page keeps this at 8:00 pm Israel time. English.");
      snprintf(m.location, sizeof m.location, "Online");
      finish(&m, emit, ctx);
    }
    if (strstr(text, "6:15 pm")) {
      HtmlMeet m;
      meet_clear(&m, program);
      snprintf(m.name, sizeof m.name, "R.A. solution discussion");
      m.weekday = 1;
      m.hour = 18;
      m.minute = 15;
      snprintf(m.zone, sizeof m.zone, "Asia/Jerusalem");
      snprintf(m.platform, sizeof m.platform, "zoom");
      snprintf(m.meeting_id, sizeof m.meeting_id, "86823856912");
      snprintf(m.password, sizeof m.password, "1234");
      snprintf(m.join, sizeof m.join, "https://us02web.zoom.us/j/86823856912");
      note_add(m.notes, sizeof m.notes, "Monday. The page keeps this at 6:15 pm Jerusalem time. English.");
      snprintf(m.location, sizeof m.location, "Online");
      finish(&m, emit, ctx);
    }
  }
  free(text);
  free(squashed);
}

static void parse_eha(const char *html, const char *program, HtmlEmit emit, void *ctx) {
  char *text = html_text_str(html);
  char low[1];
  (void)low;
  if (!find_ci(text, "sgveha@hotmail.com")) {
    free(text);
    return;
  }
  const char *email = "sgveha@hotmail.com";
  const char *note = "Virtual login is not on the page. The San Gabriel Valley intergroup says to email and they will send it.";
  struct {
    const char *name;
    int wd, hour, minute;
    const char *platform, *mid, *join, *who, *notes, *loc;
  } specs[] = {
      {"Big Book study", 7, 16, 0, "email", email, "mailto:sgveha@hotmail.com", "ALL", note, "San Gabriel Valley"},
      {"45 Live", 1, 20, 15, "inperson", "45 E. Laurel Ave, Sierra Madre, CA", "", "ALL",
       "Episcopal Church of the Ascension, large blue house behind the church. Virtual login is by email to sgveha@hotmail.com.",
       "45 E. Laurel Ave, Sierra Madre, CA"},
      {"At the Gates", 3, 20, 15, "email", email, "mailto:sgveha@hotmail.com", "ALL", note, "San Gabriel Valley"},
      {"Men's meeting", 4, 20, 15, "email", email, "mailto:sgveha@hotmail.com", "MEN_ONLY", note, "San Gabriel Valley"},
      {"Page 102", 5, 20, 15, "email", email, "mailto:sgveha@hotmail.com", "ALL", note, "San Gabriel Valley"},
  };
  for (size_t i = 0; i < sizeof specs / sizeof specs[0]; i++) {
    char first[40];
    snprintf(first, sizeof first, "%s", specs[i].name);
    char *sp = strchr(first, ' ');
    if (sp) *sp = 0;
    if (!find_ci(text, first) && !find_ci(text, specs[i].name)) continue;
    HtmlMeet m;
    meet_clear(&m, program);
    snprintf(m.name, sizeof m.name, "%s", specs[i].name);
    m.weekday = specs[i].wd;
    m.hour = specs[i].hour;
    m.minute = specs[i].minute;
    snprintf(m.zone, sizeof m.zone, "America/Los_Angeles");
    snprintf(m.platform, sizeof m.platform, "%s", specs[i].platform);
    snprintf(m.meeting_id, sizeof m.meeting_id, "%s", specs[i].mid);
    if (specs[i].join[0]) snprintf(m.join, sizeof m.join, "%s", specs[i].join);
    note_add(m.notes, sizeof m.notes, specs[i].notes);
    snprintf(m.contact, sizeof m.contact, "%s", email);
    snprintf(m.gender, sizeof m.gender, "%s", specs[i].who);
    snprintf(m.location, sizeof m.location, "%s", specs[i].loc);
    finish(&m, emit, ctx);
  }
  free(text);
}

static int day_word_at(const char *p, char *word, size_t n, int *weekday) {
  static const char *stems[] = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"};
  if (!p || !isalpha((unsigned char)*p)) return 0;
  if (p > (const char *)1) {
    /* caller checks the leading boundary */
  }
  for (int i = 0; i < 7; i++) {
    size_t L = strlen(stems[i]);
    if (!ci_starts(p, stems[i])) continue;
    const char *q = p + L;
    if (*q == 's' || *q == 'S') q++;
    if (word_byte((unsigned char)*q)) continue;
    size_t len = (size_t)(q - p);
    if (len >= n) return 0;
    memcpy(word, p, len);
    word[len] = 0;
    *weekday = i + 1;
    return 1;
  }
  return 0;
}

static void parse_coanon_html(const char *html, const char *page, const char *program, HtmlEmit emit, void *ctx) {
  const char *p = html;
  while (*p) {
    char word[20];
    int weekday = 0;
    int boundary = p == html || !word_byte((unsigned char)p[-1]);
    if (!(boundary && day_word_at(p, word, sizeof word, &weekday))) {
      p++;
      continue;
    }
    const char *next = p + 1;
    const char *end = html + strlen(html);
    while (*next) {
      char w2[20];
      int wd2 = 0;
      int b2 = !word_byte((unsigned char)next[-1]);
      if (b2 && day_word_at(next, w2, sizeof w2, &wd2)) {
        end = next;
        break;
      }
      next++;
    }
    char *plain = html_text(p, end);
    const char *when = find_ci(plain, "When:");
    if (!when) {
      free(plain);
      p += strlen(word);
      continue;
    }
    when += 5;
    while (*when && isspace((unsigned char)*when)) when++;
    char whenline[120];
    size_t wi = 0;
    while (when[wi] && when[wi] != '\n' && wi + 1 < sizeof whenline) {
      whenline[wi] = when[wi];
      wi++;
    }
    whenline[wi] = 0;
    int hour, minute;
    if (!clock_scan(whenline, &hour, &minute)) {
      free(plain);
      p += strlen(word);
      continue;
    }
    char zone[80] = "", zone_note[160] = "";
    const char *tz = find_ci(plain, "Time zone:");
    if (tz) {
      tz += strlen("Time zone:");
      while (*tz && isspace((unsigned char)*tz)) tz++;
      char zline[160];
      size_t zi = 0;
      while (tz[zi] && tz[zi] != '\n' && zi + 1 < sizeof zline) {
        zline[zi] = tz[zi];
        zi++;
      }
      zline[zi] = 0;
      zone_for(zline, zone, sizeof zone);
    }
    if (!zone[0] && (find_ci(plain, "ontario") || find_ci(plain, "sudbury"))) {
      snprintf(zone, sizeof zone, "America/Toronto");
      snprintf(zone_note, sizeof zone_note, "The page does not name a time zone. Stored as Eastern because the address is in Ontario.");
    }
    if (!zone[0]) {
      free(plain);
      p += strlen(word);
      continue;
    }
    char where[300] = "", langline[80] = "", topic[200] = "", contact[240] = "";
    const char *wh = find_ci(plain, "Where:");
    if (wh) {
      wh += 6;
      while (*wh && isspace((unsigned char)*wh)) wh++;
      size_t i = 0;
      while (wh[i] && wh[i] != '\n' && i + 1 < sizeof where) {
        where[i] = wh[i];
        i++;
      }
      where[i] = 0;
      squeeze(where);
    }
    const char *lg = find_ci(plain, "Language:");
    if (lg) {
      lg += 9;
      while (*lg && isspace((unsigned char)*lg)) lg++;
      size_t i = 0;
      while (lg[i] && lg[i] != '\n' && i + 1 < sizeof langline) {
        langline[i] = lg[i];
        i++;
      }
      langline[i] = 0;
      squeeze(langline);
    }
    const char *tp = find_ci(plain, "Meeting type/topic:");
    if (tp) {
      tp += strlen("Meeting type/topic:");
      while (*tp && isspace((unsigned char)*tp)) tp++;
      size_t i = 0;
      while (tp[i] && tp[i] != '\n' && i + 1 < sizeof topic) {
        topic[i] = tp[i];
        i++;
      }
      topic[i] = 0;
      squeeze(topic);
    }
    const char *ct = find_ci(plain, "Contact:");
    if (ct) {
      ct += 8;
      while (*ct && isspace((unsigned char)*ct)) ct++;
      size_t i = 0;
      while (ct[i] && ct[i] != '\n' && i + 1 < sizeof contact) {
        contact[i] = ct[i];
        i++;
      }
      contact[i] = 0;
      squeeze(contact);
    }
    char name[200] = "";
    /* One line between the day word and When: is the name. Otherwise the line before When. */
    char middle[300];
    const char *day_end = plain + strlen(word);
    const char *when_at = find_ci(plain, "When:");
    while (*day_end && isspace((unsigned char)*day_end)) day_end++;
    const char *mid_end = when_at;
    while (mid_end > day_end && isspace((unsigned char)mid_end[-1])) mid_end--;
    size_t ml = (size_t)(mid_end - day_end);
    int multiline = 0;
    for (size_t i = 0; i < ml; i++)
      if (day_end[i] == '\n') multiline = 1;
    if (!multiline && ml && ml < sizeof middle) {
      memcpy(middle, day_end, ml);
      middle[ml] = 0;
      squeeze(middle);
      snprintf(name, sizeof name, "%s", middle);
    }
    if (!name[0] || ci_eq(name, "when:") || ci_eq(name, page) || ci_eq(name, "co-anon")) {
      name[0] = 0;
      char lines[40][180];
      int nl = 0;
      const char *lp = plain;
      while (*lp && nl < 40) {
        while (*lp == '\n') lp++;
        if (!*lp) break;
        const char *le = strchr(lp, '\n');
        if (!le) le = lp + strlen(lp);
        while (lp < le && isspace((unsigned char)*lp)) lp++;
        const char *rt = le;
        while (rt > lp && isspace((unsigned char)rt[-1])) rt--;
        size_t L = (size_t)(rt - lp);
        if (L && L < 180) {
          memcpy(lines[nl], lp, L);
          lines[nl][L] = 0;
          nl++;
        }
        lp = *le ? le + 1 : le;
      }
      for (int i = 0; i < nl; i++) {
        if (!ci_starts(lines[i], "when")) continue;
        for (int j = i - 1; j >= 0; j--) {
          char dw[20];
          int dummy = 0;
          if (day_word_at(lines[j], dw, sizeof dw, &dummy) && ci_eq(lines[j], dw)) break;
          if (find_ci(lines[j], "first meeting") || find_ci(lines[j], "copyright") || find_ci(lines[j], "below you")) continue;
          snprintf(name, sizeof name, "%s", lines[j]);
          break;
        }
        break;
      }
    }
    if (!name[0]) snprintf(name, sizeof name, "Co-Anon");
    char platform[16] = "", meeting_id[256] = "", join[512] = "";
    const char *href = p;
    while ((href = find_ci_end(href, end, "zoom.us/j/"))) {
      const char *hs = href;
      while (hs > p && *hs != '"' && *hs != '\'' && (size_t)(href - hs) < 40) hs--;
      if (*hs == '"' || *hs == '\'') hs++;
      if (ci_starts(hs, "http")) {
        size_t i = 0;
        while (hs < end && i + 1 < sizeof join && *hs && *hs != '"' && *hs != '\'') join[i++] = *hs++;
        join[i] = 0;
        strip_query(join);
        char digits[20];
        if (find_zoom(join, digits, sizeof digits)) {
          snprintf(platform, sizeof platform, "zoom");
          snprintf(meeting_id, sizeof meeting_id, "%s", digits);
        }
        break;
      }
      href += 8;
    }
    if (!platform[0] && find_ci(plain, "zoom")) {
      char idbuf[40] = "";
      capture_after(plain, "Meeting ID:", idbuf, sizeof idbuf, ok_id_body);
      if (!idbuf[0]) capture_after(plain, "Meeting ID", idbuf, sizeof idbuf, ok_id_body);
      char digits[20];
      only_digits(idbuf, digits, sizeof digits);
      if (strlen(digits) >= 9 && strlen(digits) <= 12) {
        snprintf(platform, sizeof platform, "zoom");
        snprintf(meeting_id, sizeof meeting_id, "%s", digits);
        snprintf(join, sizeof join, "https://zoom.us/j/%s", digits);
      }
    }
    if (!platform[0] && where[0] && !find_ci(plain, "visit the co-anon")) {
      snprintf(platform, sizeof platform, "inperson");
      snprintf(meeting_id, sizeof meeting_id, "%s", where);
    }
    if (!platform[0]) {
      free(plain);
      p += strlen(word);
      continue;
    }
    char pwraw[80] = "";
    const char *pw = find_ci(plain, "Password:");
    if (pw) {
      pw += 9;
      while (*pw && isspace((unsigned char)*pw)) pw++;
      size_t i = 0;
      while (pw[i] && i + 1 < sizeof pwraw && i < 24 && (isalnum((unsigned char)pw[i]) || pw[i] == ' ')) {
        pwraw[i] = pw[i];
        i++;
      }
      pwraw[i] = 0;
      squeeze(pwraw);
    }
    char page_note[80];
    char pretty[40];
    snprintf(pretty, sizeof pretty, "%s", page);
    for (char *q = pretty; *q; q++)
      if (*q == '-') *q = ' ';
    snprintf(page_note, sizeof page_note, "Co-Anon, %s.", pretty);
    HtmlMeet m;
    meet_clear(&m, program);
    snprintf(m.name, sizeof m.name, "%s", name);
    m.weekday = weekday;
    m.hour = hour;
    m.minute = minute;
    m.duration = duration_of(whenline, hour, minute);
    snprintf(m.zone, sizeof m.zone, "%s", zone);
    snprintf(m.platform, sizeof m.platform, "%s", platform);
    snprintf(m.meeting_id, sizeof m.meeting_id, "%s", meeting_id);
    snprintf(m.password, sizeof m.password, "%s", pwraw);
    snprintf(m.join, sizeof m.join, "%s", join);
    note_add(m.notes, sizeof m.notes, page_note);
    if (topic[0]) note_add(m.notes, sizeof m.notes, topic);
    if (zone_note[0]) note_add(m.notes, sizeof m.notes, zone_note);
    if (find_ci(plain, "first meeting")) note_add(m.notes, sizeof m.notes, "First meeting date is on the page.");
    snprintf(m.contact, sizeof m.contact, "%s", contact);
    gender_for(name, m.gender, sizeof m.gender);
    char lkey[80];
    lower_copy(lkey, sizeof lkey, langline[0] ? langline : "english");
    snprintf(m.language, sizeof m.language, "English");
    for (int i = 0; LANGS[i].k; i++)
      if (!strcmp(lkey, LANGS[i].k)) snprintf(m.language, sizeof m.language, "%s", LANGS[i].v);
    if (where[0]) snprintf(m.location, sizeof m.location, "%s", where);
    else if (ci_eq(platform, "zoom")) snprintf(m.location, sizeof m.location, "Online");
    else snprintf(m.location, sizeof m.location, "%s", pretty);
    finish(&m, emit, ctx);
    free(plain);
    p = end;
  }
}

static char *read_file(const char *path, char *err, size_t errn) {
  FILE *f = fopen(path, "rb");
  if (!f) {
    snprintf(err, errn, "cannot read %s", path);
    return NULL;
  }
  if (fseek(f, 0, SEEK_END) != 0) {
    fclose(f);
    snprintf(err, errn, "cannot read %s", path);
    return NULL;
  }
  long n = ftell(f);
  if (n < 0 || n > 32l * 1024l * 1024l) {
    fclose(f);
    snprintf(err, errn, "file is too large");
    return NULL;
  }
  fseek(f, 0, SEEK_SET);
  char *s = malloc((size_t)n + 1);
  if (!s) die_mem();
  if (fread(s, 1, (size_t)n, f) != (size_t)n) {
    free(s);
    fclose(f);
    snprintf(err, errn, "cannot read %s", path);
    return NULL;
  }
  fclose(f);
  s[n] = 0;
  return s;
}

static char *grab(const char *url, char *err, size_t errn) {
  char local[200] = "";
  char *body = https_get_as(url, CHROME_UA, NULL, local, sizeof local);
  if (!body) snprintf(err, errn, "%s", local[0] ? local : "fetch failed");
  return body;
}

static const char *js(const cJSON *obj, const char *key) {
  if (!obj) return "";
  cJSON *item = cJSON_GetObjectItemCaseSensitive((cJSON *)obj, key);
  if (cJSON_IsString(item) && item->valuestring) return item->valuestring;
  return "";
}

typedef struct {
  HtmlEmit emit;
  void *ctx;
  int n;
} Count;

static void counting_emit(void *ctx, const HtmlMeet *m) {
  Count *c = ctx;
  c->n++;
  if (c->emit) c->emit(c->ctx, m);
}

static int load_source(cJSON *spec, const char *file_key, const char *page_key, int offline, int required, char **out, char *err, size_t errn) {
  *out = NULL;
  const char *file = js(spec, file_key);
  const char *page = js(spec, page_key);
  if (file[0]) {
    *out = read_file(file, err, errn);
    return *out ? 0 : -1;
  }
  if (offline || !page[0]) {
    if (required) {
      snprintf(err, errn, "missing %s", page_key);
      return -1;
    }
    return 0;
  }
  *out = grab(page, err, errn);
  if (!*out) return required ? -1 : 0;
  return 0;
}

static const char *COANON_SLUGS[] = {"arizona", "germany", "sweden", "california", "netherlands", "texas", "canada", "south-africa", "united-kingdom"};

static char *coanon_local(const char *dir, const char *slug) {
  char path[512];
  const char *aliases[] = {slug, NULL, NULL};
  char alt[80];
  snprintf(alt, sizeof alt, "coanon-%s.html", slug);
  aliases[1] = alt;
  if (!strcmp(slug, "arizona")) aliases[2] = "coanon-az.html";
  if (!strcmp(slug, "germany")) aliases[2] = "coanon-de.html";
  if (!strcmp(slug, "texas")) aliases[2] = "coanon-tx.html";
  if (!strcmp(slug, "south-africa")) aliases[2] = "coanon-za.html";
  if (!strcmp(slug, "united-kingdom")) aliases[2] = "coanon-uk.html";
  if (!strcmp(slug, "canada")) aliases[2] = "coanon-ca.html";
  if (!strcmp(slug, "sweden")) aliases[2] = "coanon-se.html";
  if (!strcmp(slug, "netherlands")) aliases[2] = "coanon-nl.html";
  if (!strcmp(slug, "california")) aliases[2] = "coanon-california.html";
  for (int i = 0; i < 3; i++) {
    if (!aliases[i]) continue;
    if (strchr(aliases[i], '/')) continue;
    snprintf(path, sizeof path, "%s/%s", dir, aliases[i]);
    char err[8];
    char *s = read_file(path, err, sizeof err);
    if (s) return s;
    snprintf(path, sizeof path, "%s/%s.html", dir, aliases[i]);
    s = read_file(path, err, sizeof err);
    if (s) return s;
  }
  return NULL;
}

static int parse_coanon(cJSON *spec, const char *program, HtmlEmit emit, void *ctx, char *err, size_t errn) {
  const char *file = js(spec, "file");
  int offline = cJSON_IsTrue(cJSON_GetObjectItemCaseSensitive(spec, "offline"));
  struct stat st;
  int loaded = 0, failed = 0;
  if (file[0] && stat(file, &st) == 0 && S_ISREG(st.st_mode)) {
    char *html = read_file(file, err, errn);
    if (!html) return -1;
    parse_coanon_html(html, "local", program, emit, ctx);
    free(html);
    return 0;
  }
  for (size_t i = 0; i < sizeof COANON_SLUGS / sizeof COANON_SLUGS[0]; i++) {
    const char *slug = COANON_SLUGS[i];
    char *html = NULL;
    if (file[0]) html = coanon_local(file, slug);
    if (!html && !offline) {
      char url[160];
      snprintf(url, sizeof url, "https://www.co-anon.org/meetings/%s", slug);
      char local[200];
      html = grab(url, local, sizeof local);
      if (!html) {
        fprintf(stderr, "coanon skip %s: %s\n", slug, local[0] ? local : "fetch failed");
        failed++;
        continue;
      }
    }
    if (!html) continue;
    loaded++;
    parse_coanon_html(html, slug, program, emit, ctx);
    free(html);
  }
  if (!loaded && failed) {
    snprintf(err, errn, "coanon pages did not load");
    return -1;
  }
  if (!loaded && offline) {
    snprintf(err, errn, "no coanon pages in %s", file[0] ? file : "the folder");
    return -1;
  }
  return 0;
}

static int required_parser(const char *parser) {
  return !strcmp(parser, "arts") || !strcmp(parser, "ceahow") || !strcmp(parser, "dda") || !strcmp(parser, "faa") ||
         !strcmp(parser, "aba");
}

int html_collect(const char *parser, const char *program, cJSON *spec, HtmlEmit emit, void *ctx, char *err, size_t errn) {
  if (err && errn) err[0] = 0;
  if (!parser || !parser[0]) {
    snprintf(err, errn, "missing parser");
    return -1;
  }
  if (!strcmp(parser, "ra")) parser = "recoveries";
  if (!program || !program[0] || !strcmp(program, "ra")) program = parser;
  if (!strcmp(parser, "sia")) {
    snprintf(err, errn, "sia is not fetched; the site does not return a list");
    return -1;
  }
  if (!strcmp(parser, "coanon")) return parse_coanon(spec, program, emit, ctx, err, errn);
  int offline = spec && cJSON_IsTrue(cJSON_GetObjectItemCaseSensitive(spec, "offline"));
  char *html = NULL, *html2 = NULL;
  if (load_source(spec, "file", "page", offline, 1, &html, err, errn) != 0) return -1;
  int want2 = !strcmp(parser, "dda") || !strcmp(parser, "faa");
  if (want2) {
    int hard = !strcmp(parser, "faa") && !offline && js(spec, "page2")[0];
    char err2[200] = "";
    if (load_source(spec, "file2", "page2", offline, hard, &html2, err2, sizeof err2) != 0) {
      if (!strcmp(parser, "dda")) fprintf(stderr, "dda uk: %s\n", err2[0] ? err2 : "fetch failed");
      else {
        snprintf(err, errn, "%s", err2[0] ? err2 : "second page failed");
        free(html);
        return -1;
      }
    }
  }
  Count cnt = {emit, ctx, 0};
  if (!strcmp(parser, "arts")) parse_arts(html, program, counting_emit, &cnt);
  else if (!strcmp(parser, "ceahow")) parse_ceahow(html, program, counting_emit, &cnt);
  else if (!strcmp(parser, "dda")) {
    parse_dda_oregon(html, program, counting_emit, &cnt);
    if (html2) parse_dda_uk(html2, program, counting_emit, &cnt);
  } else if (!strcmp(parser, "faa")) parse_faa(html, html2, program, counting_emit, &cnt);
  else if (!strcmp(parser, "aba")) parse_aba(html, program, counting_emit, &cnt);
  else if (!strcmp(parser, "recoveries")) parse_recoveries(html, program, counting_emit, &cnt);
  else if (!strcmp(parser, "eha")) parse_eha(html, program, counting_emit, &cnt);
  else {
    snprintf(err, errn, "unknown parser %s", parser);
    free(html);
    free(html2);
    return -1;
  }
  free(html);
  free(html2);
  if (required_parser(parser) && cnt.n == 0) {
    snprintf(err, errn, "no meetings parsed");
    return -1;
  }
  if (err && errn) err[0] = 0;
  return 0;
}

int html_parse_path(const char *parser, const char *program, const char *path, const char *path2, HtmlEmit emit, void *ctx, char *err, size_t errn) {
  cJSON *spec = cJSON_CreateObject();
  if (!spec) {
    snprintf(err, errn, "out of memory");
    return -1;
  }
  if (path) cJSON_AddStringToObject(spec, "file", path);
  if (path2) cJSON_AddStringToObject(spec, "file2", path2);
  cJSON_AddBoolToObject(spec, "offline", 1);
  int rc = html_collect(parser, program, spec, emit, ctx, err, errn);
  cJSON_Delete(spec);
  return rc;
}

static int g_fail;

static void expect_int(const char *what, int got, int want) {
  if (got != want) {
    fprintf(stderr, "html %s: got %d wanted %d\n", what, got, want);
    g_fail++;
  }
}

static void expect_str(const char *what, const char *got, const char *want) {
  if (!got) got = "";
  if (strcmp(got, want)) {
    fprintf(stderr, "html %s: got [%s] wanted [%s]\n", what, got, want);
    g_fail++;
  }
}

typedef struct {
  HtmlMeet a[16];
  int n;
} Bag;

static void bag_emit(void *ctx, const HtmlMeet *m) {
  Bag *b = ctx;
  if (b->n < 16) b->a[b->n++] = *m;
}

int html_self_test(void) {
  g_fail = 0;
  int h, m;
  expect_int("noon", clock_scan("11:00-12:00 PM", &h, &m) ? h * 60 + m : -1, 11 * 60);
  expect_int("noon dur", duration_of("11:00-12:00 PM", 11, 0), 60);
  expect_int("1030", clock_scan("10:30-12:00 PM", &h, &m) ? h * 60 + m : -1, 10 * 60 + 30);
  expect_int("1030 dur", duration_of("10:30-12:00 PM", 10, 30), 90);
  expect_int("7pm", clock_scan("7:00 \xe2\x80\x93 8:00 PM", &h, &m) ? h : -1, 19);
  expect_int("8am", clock_scan("8:00-9:00 AM", &h, &m) ? h : -1, 8);
  expect_int("630", clock_scan("6:00-6:30 PM", &h, &m) ? h * 60 + m : -1, 18 * 60);
  expect_int("630 dur", duration_of("6:00-6:30 PM", 18, 0), 30);
  expect_int("no mer", clock_scan("10:00-11:00", &h, &m), 0);
  expect_int("first number", clock_scan("Room 2 at 7:00 PM", &h, &m), 0);
  char zone[80];
  zone_for("CET", zone, sizeof zone);
  expect_str("cet", zone, "Europe/Berlin");
  zone_for("Eastern Time (ET)", zone, sizeof zone);
  expect_str("eastern", zone, "America/New_York");
  zone_for("Mountain Standard Time (MST)", zone, sizeof zone);
  expect_str("mst phrase", zone, "America/Phoenix");
  zone_for("mst", zone, sizeof zone);
  expect_str("bare mst", zone, "America/Denver");
  zone_for("SAST", zone, sizeof zone);
  expect_str("sast", zone, "Africa/Johannesburg");
  zone_for("ET (US)", zone, sizeof zone);
  expect_str("et us", zone, "America/New_York");
  zone_for("gmt", zone, sizeof zone);
  expect_str("gmt", zone, "Europe/London");
  zone_for("central european time", zone, sizeof zone);
  expect_str("cet long", zone, "Europe/Berlin");
  expect_int("utc", zone_known("UTC"), 1);
  expect_int("toronto", zone_known("America/Toronto"), 1);
  expect_int("jerusalem", zone_known("Asia/Jerusalem"), 1);
  char phone[32];
  phone_digits("(607) 374-1154", "", phone, sizeof phone);
  expect_str("nanp", phone, "16073741154");
  phone_digits("717 908 1834", "", phone, sizeof phone);
  expect_str("spaces", phone, "17179081834");
  phone_digits("075 554 5033", "France", phone, sizeof phone);
  expect_str("france", phone, "33755545033");
  phone_digits("8573570330", "Ireland", phone, sizeof phone);
  expect_str("ireland", phone, "18573570330");
  char pw[40];
  human_pw("724714#", pw, sizeof pw);
  expect_str("hash", pw, "724714");
  human_pw("PIN: 714 283 914#", pw, sizeof pw);
  expect_str("pin", pw, "714283914");
  human_pw("Paris, France", pw, sizeof pw);
  expect_str("comma", pw, "");
  human_pw("708 303", pw, sizeof pw);
  expect_str("compact", pw, "708303");
  human_pw("DDA", pw, sizeof pw);
  expect_str("dda", pw, "DDA");
  human_pw("Gelassenheit!123", pw, sizeof pw);
  expect_str("bang", pw, "Gelassenheit!123");
  human_pw("not provided", pw, sizeof pw);
  expect_str("none", pw, "");
  char g[16];
  gender_for("Women Only meeting", g, sizeof g);
  expect_str("women", g, "WOMEN_ONLY");
  gender_for("No Saints Men\xe2\x80\x99s Meeting", g, sizeof g);
  expect_str("mens", g, "MEN_ONLY");
  gender_for("please mention the steps", g, sizeof g);
  expect_str("mention", g, "ALL");
  int days[8];
  char note[80];
  expect_int("thru", expand_days("Monday thru Sunday", days, note, sizeof note), 7);
  expect_int("mf", expand_days("Monday-Friday", days, note, sizeof note), 5);
  expect_int("ss", expand_days("Saturday-Sunday", days, note, sizeof note), 2);
  expect_int("ss0", days[0], 6);
  const char *arts =
      "<table><tr><td>PHONE</td><td>Monday</td><td>6:00-6:30 PM</td><td>CET</td><td>French</td><td>France</td>"
      "<td>5-ALIVE PHONE MEETING</td><td>Artists working</td><td>075 554 5033</td><td>724714#</td><td></td></tr>"
      "<tr><td>PHONE</td><td>Wednesday</td><td>11:00-12:00 PM</td><td>ET (US)</td><td>English</td><td>USA</td>"
      "<td>NOON</td><td>theme</td><td>717 908 1834</td><td>354292</td><td></td></tr>"
      "<tr><td>In-Person</td><td>Thursday</td><td>10:00-11:30 AM</td><td>CET</td><td>French</td><td>France</td>"
      "<td></td><td></td><td>35 rue Saint Roch</td><td>Paris, France</td><td></td></tr></table>";
  Bag bag = {0};
  parse_arts(arts, "arts", bag_emit, &bag);
  expect_int("arts n", bag.n, 3);
  if (bag.n >= 1) {
    expect_int("fr hour", bag.a[0].hour, 18);
    expect_int("fr dur", bag.a[0].duration, 30);
    expect_str("fr phone", bag.a[0].meeting_id, "33755545033");
    expect_str("fr pw", bag.a[0].password, "724714");
    expect_str("fr zone", bag.a[0].zone, "Europe/Berlin");
  }
  if (bag.n >= 2) {
    expect_int("noon hour", bag.a[1].hour, 11);
    expect_int("noon dur", bag.a[1].duration, 60);
    expect_str("noon phone", bag.a[1].meeting_id, "17179081834");
    expect_str("noon pw", bag.a[1].password, "354292");
    expect_str("noon zone", bag.a[1].zone, "America/New_York");
  }
  if (bag.n >= 3) {
    expect_str("street", bag.a[2].name, "ARTS, 35 rue Saint Roch");
    expect_int("street hour", bag.a[2].hour, 10);
    expect_int("street dur", bag.a[2].duration, 90);
    expect_str("street plat", bag.a[2].platform, "inperson");
    expect_str("street pw", bag.a[2].password, "");
  }
  const char *cea =
      "<div class=\"mtg-card\" data-id=\"9\" data-format=\"phone\">"
      "<span class=\"mtg-row-time\"><small>Wednesday, </small>11:00 AM <small><span class=\"tz-label\">Eastern</span></small></span>"
      "<span class=\"mtg-row-name-text\">NOON bridge</span><span class=\"mtg-row-group\">Bridge</span>"
      "<span class=\"mtg-row-region\">Non-Geographic</span><button>Phone</button>"
      "<noscript><span>Phone</span> 717-908-1834 <span>Access Code</span> 354292</noscript></div>";
  Bag ceb = {0};
  parse_ceahow(cea, "ceahow", bag_emit, &ceb);
  expect_int("cea n", ceb.n, 1);
  if (ceb.n == 1) {
    expect_str("cea phone", ceb.a[0].meeting_id, "17179081834");
    expect_int("cea hour", ceb.a[0].hour, 11);
    expect_str("cea pw", ceb.a[0].password, "354292");
    expect_str("cea zone", ceb.a[0].zone, "America/New_York");
  }
  return g_fail;
}
