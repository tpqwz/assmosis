#ifndef ASSMOSIS_HTTPS_H
#define ASSMOSIS_HTTPS_H
#include <stddef.h>

/* HTTPS GET. Returns a malloc'd NUL-terminated body, or NULL.
   *out_len is the byte length without the NUL. err may be NULL. */
char *https_get(const char *url, size_t *out_len, char *err, size_t errlen);
/* Same, with a caller-supplied User-Agent. ua NULL uses the default. */
char *https_get_as(const char *url, const char *ua, size_t *out_len, char *err, size_t errlen);
#endif
