#include "https.h"

#include <bearssl.h>
#include <errno.h>
#include <netdb.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <sys/socket.h>
#include <sys/time.h>
#include <unistd.h>

#include "trust_anchors.h"

#define HTTPS_MAX (32u * 1024u * 1024u)

static int sock_read(void *ctx, unsigned char *buf, size_t len) {
  int fd = *(int *)ctx;
  for (;;) {
    ssize_t r = read(fd, buf, len);
    if (r < 0 && errno == EINTR) continue;
    return r <= 0 ? -1 : (int)r;
  }
}

static int sock_write(void *ctx, const unsigned char *buf, size_t len) {
  int fd = *(int *)ctx;
  for (;;) {
    ssize_t w = write(fd, buf, len);
    if (w < 0 && errno == EINTR) continue;
    return w <= 0 ? -1 : (int)w;
  }
}

static void set_err(char *err, size_t n, const char *msg) {
  if (err && n) snprintf(err, n, "%s", msg);
}

static int connect_host(const char *host, const char *port) {
  struct addrinfo hints, *si, *p;
  int fd = -1;
  memset(&hints, 0, sizeof hints);
  hints.ai_family = PF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  if (getaddrinfo(host, port, &hints, &si) != 0) return -1;
  for (p = si; p; p = p->ai_next) {
    fd = socket(p->ai_family, p->ai_socktype, p->ai_protocol);
    if (fd < 0) continue;
    struct timeval tv;
    tv.tv_sec = 45;
    tv.tv_usec = 0;
    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof tv);
    setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, &tv, sizeof tv);
    if (connect(fd, p->ai_addr, p->ai_addrlen) == 0) break;
    close(fd);
    fd = -1;
  }
  freeaddrinfo(si);
  return fd;
}

static int parse_url(const char *url, char *host, size_t hostn, char *port, char *path, size_t pathn) {
  const char *p = url;
  if (strncmp(p, "https://", 8) != 0) return 0;
  p += 8;
  const char *slash = strchr(p, '/');
  const char *hostend = slash ? slash : p + strlen(p);
  const char *colon = NULL;
  for (const char *q = p; q < hostend; q++) {
    if (*q == ':') colon = q;
  }
  size_t hlen = (size_t)((colon ? colon : hostend) - p);
  if (hlen == 0 || hlen >= hostn) return 0;
  memcpy(host, p, hlen);
  host[hlen] = 0;
  if (colon && colon + 1 < hostend) {
    size_t plen = (size_t)(hostend - (colon + 1));
    if (plen == 0 || plen > 5) return 0;
    memcpy(port, colon + 1, plen);
    port[plen] = 0;
  } else {
    memcpy(port, "443", 4);
  }
  if (!slash || !slash[0]) snprintf(path, pathn, "/");
  else if (strlen(slash) >= pathn) return 0;
  else memcpy(path, slash, strlen(slash) + 1);
  return 1;
}

static char *decode_chunked(const char *in, size_t n, size_t *outn) {
  char *out = NULL;
  size_t len = 0, cap = 0;
  size_t i = 0;
  while (i < n) {
    size_t j = i;
    unsigned long sz = 0;
    int digits = 0;
    while (j < n && in[j] != '\n' && in[j] != ';') {
      char c = in[j++];
      if (c == '\r') continue;
      int v;
      if (c >= '0' && c <= '9') v = c - '0';
      else if (c >= 'a' && c <= 'f') v = c - 'a' + 10;
      else if (c >= 'A' && c <= 'F') v = c - 'A' + 10;
      else {
        free(out);
        return NULL;
      }
      sz = (sz << 4) + (unsigned)v;
      if (++digits > 6) {
        free(out);
        return NULL;
      }
    }
    if (!digits) {
      free(out);
      return NULL;
    }
    while (j < n && in[j] != '\n') j++;
    if (j >= n) {
      free(out);
      return NULL;
    }
    j++;
    if (sz == 0) break;
    if (j + sz > n || len + sz > HTTPS_MAX) {
      free(out);
      return NULL;
    }
    if (len + sz + 1 > cap) {
      size_t nc = cap ? cap * 2 : 4096;
      while (nc < len + sz + 1) nc *= 2;
      char *nb = realloc(out, nc);
      if (!nb) {
        free(out);
        return NULL;
      }
      out = nb;
      cap = nc;
    }
    memcpy(out + len, in + j, sz);
    len += sz;
    j += sz;
    if (j < n && in[j] == '\r') j++;
    if (j < n && in[j] == '\n') j++;
    i = j;
  }
  if (!out) out = calloc(1, 1);
  if (!out) return NULL;
  out[len] = 0;
  *outn = len;
  return out;
}

static int starts_ci(const char *line, const char *key) {
  size_t n = strlen(key);
  return strncasecmp(line, key, n) == 0;
}

static int has_ci(const char *line, const char *token) {
  size_t n = strlen(token);
  for (const char *p = line; *p; p++) {
    if (strncasecmp(p, token, n) == 0) return 1;
  }
  return 0;
}

static char *request_once(const char *url, const char *ua, int *status, char *location, size_t locn, char *err, size_t errn) {
  char host[256], port[8], path[4096];
  *status = 0;
  location[0] = 0;
  if (!parse_url(url, host, sizeof host, port, path, sizeof path)) {
    set_err(err, errn, "only https URLs are fetched");
    return NULL;
  }
  static int once = 0;
  if (!once) {
    signal(SIGPIPE, SIG_IGN);
    once = 1;
  }
  int fd = connect_host(host, port);
  if (fd < 0) {
    snprintf(err, errn, "could not connect to %s", host);
    return NULL;
  }
  br_ssl_client_context sc;
  br_x509_minimal_context xc;
  unsigned char iobuf[BR_SSL_BUFSIZE_BIDI];
  br_sslio_context ioc;
  br_ssl_client_init_full(&sc, &xc, TAs, TAs_NUM);
  br_ssl_engine_set_buffer(&sc.eng, iobuf, sizeof iobuf, 1);
  br_ssl_client_reset(&sc, host, 0);
  br_sslio_init(&ioc, &sc.eng, sock_read, &fd, sock_write, &fd);
  char req[8192];
  if (!ua || !ua[0]) ua = "AssmosisLists/1.0";
  int rn = snprintf(req, sizeof req,
                    "GET %s HTTP/1.0\r\nHost: %s\r\nUser-Agent: %s\r\nAccept: */*\r\nConnection: close\r\n\r\n",
                    path, host, ua);
  if (rn < 0 || (size_t)rn >= sizeof req) {
    close(fd);
    set_err(err, errn, "URL is too long");
    return NULL;
  }
  if (br_sslio_write_all(&ioc, req, (size_t)rn) != 0 || br_sslio_flush(&ioc) != 0) {
    int code = br_ssl_engine_last_error(&sc.eng);
    close(fd);
    snprintf(err, errn, "TLS write to %s failed (%d)", host, code);
    return NULL;
  }
  char *raw = NULL;
  size_t len = 0, cap = 0;
  for (;;) {
    unsigned char tmp[4096];
    int r = br_sslio_read(&ioc, tmp, sizeof tmp);
    if (r <= 0) break;
    if (len + (size_t)r + 1 > HTTPS_MAX) {
      free(raw);
      close(fd);
      set_err(err, errn, "response is too large");
      return NULL;
    }
    if (len + (size_t)r + 1 > cap) {
      size_t nc = cap ? cap * 2 : 8192;
      while (nc < len + (size_t)r + 1) nc *= 2;
      char *nb = realloc(raw, nc);
      if (!nb) {
        free(raw);
        close(fd);
        set_err(err, errn, "out of memory");
        return NULL;
      }
      raw = nb;
      cap = nc;
    }
    memcpy(raw + len, tmp, (size_t)r);
    len += (size_t)r;
  }
  close(fd);
  if (!raw || !len) {
    free(raw);
    snprintf(err, errn, "empty response from %s (tls %d)", host, br_ssl_engine_last_error(&sc.eng));
    return NULL;
  }
  raw[len] = 0;
  char *split = strstr(raw, "\r\n\r\n");
  if (!split) {
    free(raw);
    set_err(err, errn, "response had no header");
    return NULL;
  }
  size_t header_len = (size_t)(split - raw);
  char *body = split + 4;
  size_t body_len = len - header_len - 4;
  raw[header_len] = 0;
  if (!strncmp(raw, "HTTP/", 5)) {
    const char *sp = strchr(raw, ' ');
    if (sp) *status = atoi(sp + 1);
  }
  int chunked = 0;
  long content_length = -1;
  char *line = raw;
  while (line && *line) {
    char *nl = strstr(line, "\r\n");
    if (nl) *nl = 0;
    if (starts_ci(line, "Location:")) {
      const char *v = line + 9;
      while (*v == ' ' || *v == '\t') v++;
      snprintf(location, locn, "%s", v);
    } else if (starts_ci(line, "Transfer-Encoding:") && has_ci(line, "chunked")) {
      chunked = 1;
    } else if (starts_ci(line, "Content-Length:")) {
      content_length = atol(line + 15);
    }
    if (!nl) break;
    line = nl + 2;
  }
  char *out = NULL;
  if (chunked) {
    size_t outn = 0;
    out = decode_chunked(body, body_len, &outn);
    if (!out) {
      free(raw);
      set_err(err, errn, "could not read chunked response");
      return NULL;
    }
  } else {
    if (content_length >= 0 && (size_t)content_length < body_len) body_len = (size_t)content_length;
    out = malloc(body_len + 1);
    if (!out) {
      free(raw);
      set_err(err, errn, "out of memory");
      return NULL;
    }
    memcpy(out, body, body_len);
    out[body_len] = 0;
  }
  free(raw);
  return out;
}

static int resolve_redirect(const char *from, const char *location, char *dest, size_t n) {
  if (!location[0]) return 0;
  if (!strncmp(location, "https://", 8)) {
    snprintf(dest, n, "%s", location);
    return 1;
  }
  char host[256], port[8], path[4096];
  if (!parse_url(from, host, sizeof host, port, path, sizeof path)) return 0;
  if (location[0] == '/') {
    if (!strcmp(port, "443")) snprintf(dest, n, "https://%s%s", host, location);
    else snprintf(dest, n, "https://%s:%s%s", host, port, location);
    return 1;
  }
  return 0;
}

char *https_get_as(const char *url, const char *ua, size_t *out_len, char *err, size_t errlen) {
  char current[4096];
  snprintf(current, sizeof current, "%s", url);
  if (err && errlen) err[0] = 0;
  for (int hop = 0; hop < 5; hop++) {
    int status = 0;
    char location[2048];
    char *body = request_once(current, ua, &status, location, sizeof location, err, errlen);
    if (!body) return NULL;
    if (status >= 300 && status < 400) {
      char next[4096];
      if (!resolve_redirect(current, location, next, sizeof next)) {
        free(body);
        set_err(err, errlen, "redirect had no usable location");
        return NULL;
      }
      free(body);
      snprintf(current, sizeof current, "%s", next);
      continue;
    }
    if (status != 200) {
      snprintf(err, errlen, "HTTP %d for %s", status, current);
      free(body);
      return NULL;
    }
    if (out_len) *out_len = strlen(body);
    return body;
  }
  set_err(err, errlen, "too many redirects");
  return NULL;
}

char *https_get(const char *url, size_t *out_len, char *err, size_t errlen) {
  return https_get_as(url, NULL, out_len, err, errlen);
}
